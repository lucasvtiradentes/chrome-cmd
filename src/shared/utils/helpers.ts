export function parseTabId(tabId: string | number): number {
  return typeof tabId === 'string' ? parseInt(tabId, 10) : tabId;
}
