/**
 * Popup script - Shows command history
 */

import { formatCommandDetails, formatTimeAgo, type HistoryItem } from '@chrome-cmd/shared';

// Render history
function renderHistory(history: HistoryItem[]): void {
  const emptyState = document.getElementById('empty-state');
  const historyList = document.getElementById('history-list');

  if (!emptyState || !historyList) return;

  if (!history || history.length === 0) {
    emptyState.style.display = 'flex';
    historyList.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  historyList.style.display = 'block';
  historyList.innerHTML = '';

  // Show last 20 commands
  const recentHistory = history.slice(-20).reverse();

  recentHistory.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'history-item';

    const commandType = item.command.replace(/_/g, ' ');

    div.innerHTML = `
      <div class="command-header">
        <span class="command-type ${item.command}">${commandType}</span>
        <span class="command-time">${formatTimeAgo(item.timestamp)}</span>
      </div>
      <div class="command-details">${formatCommandDetails(item.command, item.data)}</div>
    `;

    historyList.appendChild(div);
  });
}

// Load history from storage
async function loadHistory(): Promise<void> {
  const result = await chrome.storage.local.get(['commandHistory']);
  const history = (result.commandHistory as HistoryItem[]) || [];
  renderHistory(history);
}

// Clear history
async function clearHistory(): Promise<void> {
  await chrome.storage.local.set({ commandHistory: [] });
  renderHistory([]);
}

// Auto-refresh every 5 seconds
setInterval(loadHistory, 5000);

// Event listeners
const clearButton = document.getElementById('clear-history');
if (clearButton) {
  clearButton.addEventListener('click', clearHistory);
}

// Initial load
loadHistory();
