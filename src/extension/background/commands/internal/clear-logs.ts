import type { TabIdData } from '../../../../protocol/commands/definitions/tab.js';
import type { SuccessResponse } from '../../../../shared/utils/types.js';
import { parseTabId } from '../../../utils/extension-utils.js';
import { consoleLogs } from '../../logging-collector.js';

export async function clearTabLogs({ tabId }: TabIdData): Promise<SuccessResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseTabId(tabId);
  consoleLogs.set(tabIdInt, []);

  return { success: true, message: 'Logs cleared' };
}
