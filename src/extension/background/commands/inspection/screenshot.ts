import type { CaptureScreenshotData } from '../../../../protocol/commands/definitions/tab.js';
import type { CaptureScreenshotResponse } from '../../../../shared/utils/types.js';
import { parseTabId } from '../../../utils/extension-utils.js';
import { formatErrorMessage } from '../../../utils/format-error-message.js';
import { debuggerAttached } from '../../debugger-manager.js';

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

  let shouldDetach = false;

  try {
    console.log('[Background] 🔍 Checking debugger status for tab', tabIdInt);
    console.log('[Background] 🔍 debuggerAttached.has:', debuggerAttached.has(tabIdInt));

    try {
      console.log('[Background] 🔌 Attempting to attach debugger...');
      await chrome.debugger.attach({ tabId: tabIdInt }, '1.3');
      console.log('[Background] ✅ Debugger attached successfully');
      debuggerAttached.add(tabIdInt);
      shouldDetach = true;
    } catch (attachError) {
      const errorMsg = attachError instanceof Error ? attachError.message : String(attachError);
      console.log('[Background] ⚠️  Attach result:', errorMsg);

      if (errorMsg.includes('already')) {
        console.log('[Background] ✅ Debugger already attached, continuing...');
        shouldDetach = false;
      } else {
        throw attachError;
      }
    }

    try {
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

      const dataUrl = `data:image/${format};base64,${(result as { data: string }).data}`;

      if (shouldDetach) {
        console.log('[Background] 🔌 Detaching debugger...');
        await chrome.debugger.detach({ tabId: tabIdInt });
        debuggerAttached.delete(tabIdInt);
        console.log('[Background] ✅ Debugger detached');
      }

      const totalTime = Date.now() - startTime;
      console.log('[Background] ✅ TOTAL TIME:', totalTime, 'ms (', (totalTime / 1000).toFixed(2), 'seconds )');

      return {
        success: true,
        dataUrl: dataUrl,
        format: format,
        captureTimeMs: totalTime
      };
    } catch (error) {
      if (shouldDetach) {
        try {
          await chrome.debugger.detach({ tabId: tabIdInt });
          debuggerAttached.delete(tabIdInt);
        } catch (_e) {}
      }
      throw error;
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('[Background] ❌ Error capturing screenshot after', totalTime, 'ms:', error);
    throw new Error(`Failed to capture screenshot: ${formatErrorMessage(error)}`);
  }
}
