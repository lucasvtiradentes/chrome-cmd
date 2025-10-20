/**
 * Content script that injects a modal into the current page
 * to display command details
 */

import { getCommandIcon } from '../../shared/commands/command-metadata.js';
import type { HistoryItem } from '../../shared/types.js';

let modal: HTMLElement | null = null;

console.log('[Content Modal] Script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Content Modal] Received message:', message);

  if (message.action === 'showCommandDetails') {
    try {
      showModal(message.data as HistoryItem);
      sendResponse({ success: true });
      console.log('[Content Modal] Modal shown successfully');
    } catch (error) {
      console.error('[Content Modal] Error showing modal:', error);
      sendResponse({ success: false, error: String(error) });
    }
  }
  return true;
});

function createModal(): HTMLElement {
  const modalContainer = document.createElement('div');
  modalContainer.id = 'chrome-cmd-modal';
  modalContainer.innerHTML = `
    <div class="chrome-cmd-overlay"></div>
    <div class="chrome-cmd-content">
      <div class="chrome-cmd-header">
        <h2 id="chrome-cmd-title">Command Details</h2>
        <button class="chrome-cmd-close" aria-label="Close modal">✕</button>
      </div>
      <div class="chrome-cmd-body">
        <div class="chrome-cmd-section">
          <h3>Parameters</h3>
          <pre id="chrome-cmd-params" class="chrome-cmd-code"></pre>
        </div>
        <div class="chrome-cmd-section">
          <div class="chrome-cmd-section-header">
            <h3>Result</h3>
            <button id="chrome-cmd-copy" class="chrome-cmd-copy-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
          <pre id="chrome-cmd-result" class="chrome-cmd-code"></pre>
        </div>
        <div class="chrome-cmd-section">
          <h3>Execution Info</h3>
          <div id="chrome-cmd-info" class="chrome-cmd-info-grid"></div>
        </div>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = getModalStyles();
  modalContainer.appendChild(style);

  return modalContainer;
}

function showModal(item: HistoryItem): void {
  // Remove existing modal if exists
  if (modal) {
    modal.remove();
  }

  // Create and append modal
  modal = createModal();
  document.body.appendChild(modal);

  // Populate content
  const icon = getCommandIcon(item.command);
  const titleEl = modal.querySelector('#chrome-cmd-title');
  if (titleEl) {
    titleEl.innerHTML = `<span style="font-size: 20px; margin-right: 10px;">${icon}</span>${item.command.replace(/_/g, ' ')}`;
  }

  const paramsEl = modal.querySelector('#chrome-cmd-params');
  if (paramsEl) {
    paramsEl.textContent = JSON.stringify(item.data, null, 2);
  }

  const resultEl = modal.querySelector('#chrome-cmd-result');
  if (resultEl) {
    if (item.error) {
      resultEl.textContent = `Error: ${item.error}`;
      (resultEl as HTMLElement).style.color = '#ef4444';
    } else if (item.result !== undefined) {
      resultEl.textContent = JSON.stringify(item.result, null, 2);
    } else {
      resultEl.textContent = 'No result data available';
      (resultEl as HTMLElement).style.color = '#999';
    }
  }

  const infoEl = modal.querySelector('#chrome-cmd-info');
  if (infoEl) {
    const status = item.success === true ? '✅ Success' : item.success === false ? '❌ Error' : '⏳ Pending';
    const executionTime = item.executionTime ? `${item.executionTime}ms` : 'N/A';
    const timestamp = new Date(item.timestamp).toLocaleString();

    infoEl.innerHTML = `
      <span class="chrome-cmd-info-label">Status:</span>
      <span class="chrome-cmd-info-value">
        <span class="chrome-cmd-status-badge ${item.success ? 'success' : 'error'}">${status}</span>
      </span>
      <span class="chrome-cmd-info-label">Execution Time:</span>
      <span class="chrome-cmd-info-value">${executionTime}</span>
      <span class="chrome-cmd-info-label">Timestamp:</span>
      <span class="chrome-cmd-info-value">${timestamp}</span>
    `;
  }

  // Event listeners
  const closeBtn = modal.querySelector('.chrome-cmd-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  const overlay = modal.querySelector('.chrome-cmd-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }

  const copyBtn = modal.querySelector('#chrome-cmd-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const textToCopy = item.error || JSON.stringify(item.result, null, 2);
      navigator.clipboard.writeText(textToCopy).then(() => {
        const btn = copyBtn as HTMLElement;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Copied!
        `;
        btn.style.color = '#10b981';
        btn.style.borderColor = '#10b981';

        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.color = '';
          btn.style.borderColor = '';
        }, 2000);
      });
    });
  }

  // ESC key listener
  document.addEventListener('keydown', handleEscKey);

  // Show modal
  setTimeout(() => {
    modal?.classList.add('chrome-cmd-active');
  }, 10);
}

function closeModal(): void {
  if (modal) {
    modal.classList.remove('chrome-cmd-active');
    setTimeout(() => {
      modal?.remove();
      modal = null;
    }, 300);
  }
  document.removeEventListener('keydown', handleEscKey);

  // Notify popup that modal was closed (optional: could reopen popup)
  chrome.runtime.sendMessage({ action: 'modalClosed' }).catch(() => {
    // Popup might be closed, ignore error
  });
}

function handleEscKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    closeModal();
  }
}

function getModalStyles(): string {
  return `
    #chrome-cmd-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 2147483647;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    #chrome-cmd-modal.chrome-cmd-active {
      opacity: 1;
    }

    .chrome-cmd-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
    }

    .chrome-cmd-content {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1a1a1a;
      border-radius: 12px;
      width: 90%;
      max-width: 800px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
      border: 1px solid #2d2d2d;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .chrome-cmd-header {
      padding: 20px 24px;
      border-bottom: 1px solid #2d2d2d;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #4a5568 0%, #3a4557 100%);
      border-radius: 12px 12px 0 0;
    }

    .chrome-cmd-header h2 {
      font-size: 20px;
      font-weight: 600;
      color: white;
      margin: 0;
      display: flex;
      align-items: center;
    }

    .chrome-cmd-close {
      width: 36px;
      height: 36px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 20px;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chrome-cmd-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .chrome-cmd-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .chrome-cmd-section {
      margin-bottom: 24px;
    }

    .chrome-cmd-section:last-child {
      margin-bottom: 0;
    }

    .chrome-cmd-section h3 {
      font-size: 13px;
      font-weight: 600;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .chrome-cmd-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .chrome-cmd-section-header h3 {
      margin: 0;
    }

    .chrome-cmd-code {
      background: #0d0d0d;
      border: 1px solid #2d2d2d;
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      font-family: 'Courier New', Consolas, monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #e5e5e5;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 400px;
      margin: 0;
    }

    .chrome-cmd-copy-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px solid #3a3a3a;
      background: #2d2d2d;
      color: #999;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 0.2s ease;
    }

    .chrome-cmd-copy-btn:hover {
      background: #3a3a3a;
      border-color: #4a4a4a;
      color: #e5e5e5;
    }

    .chrome-cmd-copy-btn svg {
      display: block;
    }

    .chrome-cmd-info-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 12px;
      align-items: start;
      color: #e5e5e5;
    }

    .chrome-cmd-info-label {
      font-weight: 600;
      color: #999;
      font-size: 14px;
    }

    .chrome-cmd-info-value {
      color: #e5e5e5;
      font-size: 14px;
    }

    .chrome-cmd-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
    }

    .chrome-cmd-status-badge.success {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }

    .chrome-cmd-status-badge.error {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }

    /* Scrollbar */
    .chrome-cmd-body::-webkit-scrollbar,
    .chrome-cmd-code::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    .chrome-cmd-body::-webkit-scrollbar-track,
    .chrome-cmd-code::-webkit-scrollbar-track {
      background: #0d0d0d;
    }

    .chrome-cmd-body::-webkit-scrollbar-thumb,
    .chrome-cmd-code::-webkit-scrollbar-thumb {
      background: #3a3a3a;
      border-radius: 5px;
    }

    .chrome-cmd-body::-webkit-scrollbar-thumb:hover,
    .chrome-cmd-code::-webkit-scrollbar-thumb:hover {
      background: #4a4a4a;
    }
  `;
}
