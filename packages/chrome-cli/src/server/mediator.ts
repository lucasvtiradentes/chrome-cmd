#!/usr/bin/env node

/**
 * Mediator Server - Bridge between CLI and Chrome Extension
 * Inspired by BroTab's mediator architecture
 *
 * Architecture:
 * - HTTP server for CLI to send commands
 * - Native Messaging connection to Chrome Extension
 * - Forwards commands between CLI and Extension
 */

import { createServer } from 'node:http';
import { URL } from 'node:url';

const PORT = 8765;

// Store the connected extension port
let extensionPort: any = null;
const pendingRequests = new Map<string, any>();

// HTTP server for CLI
const server = createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  console.log(`[Mediator] ${req.method} ${url.pathname}`);

  // Handle command requests from CLI
  if (req.method === 'POST' && url.pathname === '/command') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const command = JSON.parse(body);
        console.log('[Mediator] Received command from CLI:', command);

        if (!extensionPort) {
          res.writeHead(503);
          res.end(JSON.stringify({
            success: false,
            error: 'Chrome extension not connected'
          }));
          return;
        }

        // Send command to extension
        const requestId = command.id || Date.now().toString();

        // Store the response handler
        pendingRequests.set(requestId, { res, command });

        // Send to extension via native messaging
        extensionPort.postMessage({
          ...command,
          id: requestId
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (pendingRequests.has(requestId)) {
            pendingRequests.delete(requestId);
            res.writeHead(504);
            res.end(JSON.stringify({
              success: false,
              error: 'Request timeout'
            }));
          }
        }, 10000);

      } catch (error) {
        console.error('[Mediator] Error processing command:', error);
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    });
  } else if (req.method === 'GET' && url.pathname === '/ping') {
    // Health check
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      extensionConnected: extensionPort !== null
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Handle messages from Chrome Extension
function handleExtensionMessage(message: any) {
  console.log('[Mediator] Received from extension:', message);

  const requestId = message.id;
  const pending = pendingRequests.get(requestId);

  if (pending) {
    pendingRequests.delete(requestId);

    // Send response back to CLI
    pending.res.writeHead(200, { 'Content-Type': 'application/json' });
    pending.res.end(JSON.stringify(message));
  } else {
    console.warn('[Mediator] Received response for unknown request:', requestId);
  }
}

// This will be called by the native messaging host when extension connects
export function setExtensionPort(port: any) {
  extensionPort = port;

  port.onMessage.addListener((message: any) => {
    handleExtensionMessage(message);
  });

  port.onDisconnect.addListener(() => {
    console.log('[Mediator] Extension disconnected');
    extensionPort = null;
  });

  console.log('[Mediator] Extension connected');
}

// Start server
server.listen(PORT, 'localhost', () => {
  console.log(`[Mediator] HTTP server running on http://localhost:${PORT}`);
  console.log('[Mediator] Waiting for Chrome Extension to connect...');
  console.log('[Mediator] CLI can send commands to http://localhost:${PORT}/command');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Mediator] Shutting down...');
  server.close(() => {
    console.log('[Mediator] Server closed');
    process.exit(0);
  });
});
