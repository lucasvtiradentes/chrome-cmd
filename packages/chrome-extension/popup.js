/**
 * Popup script - Shows command history
 */

// Format time ago
function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  if (seconds > 0) return `${seconds}s ago`;
  return 'just now';
}

// Format command details
function formatCommandDetails(command, data) {
  switch (command) {
    case 'list_tabs':
      return 'List all tabs';

    case 'execute_script':
      return `Execute: ${data?.code || 'N/A'}`;

    case 'close_tab':
      return `Close tab ${data?.tabId || 'N/A'}`;

    case 'activate_tab':
      return `Activate tab ${data?.tabId || 'N/A'}`;

    case 'create_tab':
      return `Create tab: ${data?.url || 'about:blank'}`;

    case 'ping':
      return 'Health check ping';

    default:
      return command;
  }
}

// Render history
function renderHistory(history) {
  const emptyState = document.getElementById('empty-state');
  const historyList = document.getElementById('history-list');

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

  recentHistory.forEach(item => {
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
async function loadHistory() {
  const result = await chrome.storage.local.get(['commandHistory']);
  renderHistory(result.commandHistory || []);
}

// Clear history
async function clearHistory() {
  await chrome.storage.local.set({ commandHistory: [] });
  renderHistory([]);
}

// Auto-refresh every 5 seconds
setInterval(loadHistory, 5000);

// Event listeners
document.getElementById('clear-history').addEventListener('click', clearHistory);

// Initial load
loadHistory();
