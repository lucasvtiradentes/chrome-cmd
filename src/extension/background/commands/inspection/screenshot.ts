import type { CaptureScreenshotData } from '../../../../protocol/commands/definitions/tab.js';
import type { CaptureScreenshotResponse } from '../../../../shared/utils/types.js';
import { parseTabId } from '../../../utils/extension-utils.js';
import { formatErrorMessage } from '../../../utils/format-error-message.js';
import { withDebugger } from '../../debugger-manager.js';

export async function captureScreenshot({
  tabId,
  format = 'png',
  quality = 90,
  fullPage = true
}: CaptureScreenshotData): Promise<CaptureScreenshotResponse> {
  if (!tabId) {
    throw new Error('tabId is required');
  }

  const tabIdInt = parseTabId(tabId);
  const startTime = Date.now();

  try {
    console.log('[Background] 🔍 Capturing screenshot for tab', tabIdInt);

    const dataUrl = await withDebugger(tabIdInt, async () => {
      console.log('[Background] ⏱️  Starting Page.captureScreenshot (', Date.now() - startTime, 'ms )');

      const screenshotParams: Record<string, unknown> = {
        format: format,
        optimizeForSpeed: true,
        fromSurface: true,
        captureBeyondViewport: fullPage
      };

      if (format === 'jpeg') {
        screenshotParams.quality = quality;
      }

      const result = await chrome.debugger.sendCommand({ tabId: tabIdInt }, 'Page.captureScreenshot', screenshotParams);

      console.log(
        '[Background] ⏱️  Screenshot captured! Size:',
        (result as { data: string }).data.length,
        'bytes (',
        Date.now() - startTime,
        'ms )'
      );

      return `data:image/${format};base64,${(result as { data: string }).data}`;
    });

    const totalTime = Date.now() - startTime;
    console.log('[Background] ✅ TOTAL TIME:', totalTime, 'ms (', (totalTime / 1000).toFixed(2), 'seconds )');

    return {
      success: true,
      dataUrl: dataUrl,
      format: format,
      captureTimeMs: totalTime
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('[Background] ❌ Error capturing screenshot after', totalTime, 'ms:', error);
    throw new Error(`Failed to capture screenshot: ${formatErrorMessage(error)}`);
  }
}
