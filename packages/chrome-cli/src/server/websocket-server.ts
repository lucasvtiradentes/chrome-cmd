#!/usr/bin/env node

/**
 * WebSocket Server - Bridge between CLI and Chrome Extension
 *
 * This server runs persistently and both the CLI and Chrome Extension connect to it.
 * It forwards messages between them.
 */

import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = 8765;

// Store connected clients
const extensionClients = new Set<any>();
const cliClients = new Set<any>();

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('[Server] New connection');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('[Server] Received message:', message);

      // Determine if this is from CLI or Extension based on message type
      if (message.type === 'register') {
        if (message.client === 'extension') {
          extensionClients.add(ws);
          console.log('[Server] Extension registered');
          ws.send(JSON.stringify({ type: 'registered', client: 'extension' }));
        } else if (message.client === 'cli') {
          cliClients.add(ws);
          console.log('[Server] CLI registered');
          ws.send(JSON.stringify({ type: 'registered', client: 'cli' }));
        }
      } else if (message.type === 'command') {
        // Forward command from CLI to Extension
        console.log(`[Server] Forwarding command to extension: ${message.command}`);
        extensionClients.forEach((client) => {
          client.send(JSON.stringify(message));
        });
      } else if (message.type === 'response') {
        // Forward response from Extension to CLI
        console.log('[Server] Forwarding response to CLI');
        cliClients.forEach((client) => {
          client.send(JSON.stringify(message));
        });
      }
    } catch (error) {
      console.error('[Server] Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('[Server] Client disconnected');
    extensionClients.delete(ws);
    cliClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('[Server] WebSocket error:', error);
  });
});

server.listen(PORT, 'localhost', () => {
  console.log(`[Server] WebSocket server running on ws://localhost:${PORT}`);
  console.log('[Server] Waiting for Chrome Extension and CLI to connect...');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  wss.close(() => {
    server.close(() => {
      console.log('[Server] Server closed');
      process.exit(0);
    });
  });
});
