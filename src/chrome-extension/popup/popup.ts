import { ChromeCommand } from '../../shared/commands/chrome-command.js';
import { formatCommandDetails, getCommandIcon } from '../../shared/commands/commands.js';
import { formatTimeAgo } from '../../shared/utils/helpers.js';
import type { HistoryItem } from '../../shared/utils/types.js';

const GITHUB_REPO_URL = 'https://github.com/lucasvtiradentes/chrome-cmd';

function renderHistory(history: HistoryItem[]): void {
  const emptyState = document.getElementById('empty-state');
  const historyList = document.getElementById('history-list');

  if (!emptyState || !historyList) return;

  // Filter to show only user commands (excluding internal commands)
  const userCommands = history.filter((item) => item.isUserCommand !== false);

  if (!userCommands || userCommands.length === 0) {
    emptyState.style.display = 'flex';
    historyList.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  historyList.style.display = 'block';
  historyList.innerHTML = '';

  const recentHistory = userCommands.slice(-20).reverse();

  recentHistory.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = `history-item ${item.success === true ? 'success' : item.success === false ? 'error' : ''}`;

    const commandType = item.command.replace(/_/g, ' ');
    const icon = getCommandIcon(item.command);
    const statusIcon = item.success === true ? '✅' : item.success === false ? '❌' : '';
    const executionTime = item.executionTime ? `${item.executionTime}ms` : '';

    div.innerHTML = `
      <div class="command-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="command-type ${item.command}">
            <span class="command-icon">${icon}</span>
            ${commandType}
          </span>
          ${statusIcon ? `<span class="command-status ${item.success ? 'success' : 'error'}">${statusIcon}</span>` : ''}
          ${executionTime ? `<span class="command-execution-time">${executionTime}</span>` : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="command-time">${formatTimeAgo(item.timestamp)}</span>
          <button class="view-details-icon" data-index="${index}" title="View full command details">👁️</button>
        </div>
      </div>
      <div class="command-details">${formatCommandDetails(item.command, item.data)}</div>
    `;

    historyList.appendChild(div);
  });

  // Add event listeners for view details icon
  document.querySelectorAll('.view-details-icon').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0', 10);
      showCommandDetails(recentHistory[index]);
    });
  });
}

async function updateConnectionStatus(): Promise<void> {
  const result = await chrome.storage.local.get(['mediatorConnected']);
  const isConnected = result.mediatorConnected === true;

  const statusElement = document.getElementById('connection-status');

  if (statusElement) {
    if (isConnected) {
      statusElement.classList.add('connected');
      statusElement.title = 'Mediator connected - CLI commands are working';
    } else {
      statusElement.classList.remove('connected');
      statusElement.title = 'Mediator disconnected - Start mediator or run a CLI command';
    }
  }
}

async function loadHistory(): Promise<void> {
  const result = await chrome.storage.local.get(['commandHistory']);
  const history = (result.commandHistory as HistoryItem[]) || [];
  renderHistory(history);
}

async function clearHistory(): Promise<void> {
  await chrome.storage.local.set({ commandHistory: [] });
  renderHistory([]);
}

async function reloadExtension(): Promise<void> {
  const button = document.getElementById('reload-extension') as HTMLButtonElement;
  if (!button) return;

  const originalHTML = button.innerHTML;
  button.disabled = true;
  button.style.opacity = '0.5';

  button.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
    </svg>
    <style>
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    </style>
  `;

  try {
    const response = await chrome.runtime.sendMessage({
      command: ChromeCommand.RELOAD_EXTENSION
    });

    if (response?.success) {
      console.log('[Popup] Extension reload initiated');
    }
  } catch (error) {
    console.error('[Popup] Failed to reload extension:', error);
    button.innerHTML = originalHTML;
    button.disabled = false;
    button.style.opacity = '1';
  }
}

function openGitHub(): void {
  chrome.tabs.create({ url: GITHUB_REPO_URL });
}

async function showCommandDetails(item: HistoryItem): Promise<void> {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      console.error('[Popup] No active tab found');
      alert('No active tab found. Please open a webpage first.');
      return;
    }

    console.log('[Popup] Sending message to tab:', tab.id);

    // Try to send message to content script
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showCommandDetails',
        data: item
      });
      console.log('[Popup] Message sent successfully');
    } catch (error) {
      console.error('[Popup] Failed to send message, trying to inject script:', error);

      // If content script is not loaded, inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-modal.js']
        });

        console.log('[Popup] Content script injected, retrying message...');

        // Wait a bit for script to load
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Retry sending message
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showCommandDetails',
          data: item
        });

        console.log('[Popup] Message sent after injection');
      } catch (injectError) {
        console.error('[Popup] Failed to inject content script:', injectError);
        alert('Failed to open modal. Please try reloading the page.');
      }
    }
  } catch (error) {
    console.error('[Popup] Error in showCommandDetails:', error);
    alert('An error occurred. Please check the console.');
  }
}

setInterval(loadHistory, 5000);
setInterval(updateConnectionStatus, 1000);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.mediatorConnected) {
    updateConnectionStatus();
  }
});

const clearButton = document.getElementById('clear-history');
if (clearButton) {
  clearButton.addEventListener('click', clearHistory);
}

const reloadButton = document.getElementById('reload-extension');
if (reloadButton) {
  reloadButton.addEventListener('click', reloadExtension);
}

const githubButton = document.getElementById('open-github');
if (githubButton) {
  githubButton.addEventListener('click', openGitHub);
}

loadHistory();
updateConnectionStatus();
