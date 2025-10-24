import type { SuccessResponse } from '../../../../shared/utils/types.js';

export async function reloadExtension(): Promise<SuccessResponse> {
  console.log('[Background] Reloading extension...');

  chrome.runtime.reload();

  return { success: true, message: 'Extension reloaded' };
}
