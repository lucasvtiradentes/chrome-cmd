import fs from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Command } from 'commander';
import type { TabsScreenshotOptions } from '../../../../shared/commands/definitions/tab.js';
import { CommandNames, SubCommandNames } from '../../../../shared/commands/definitions.js';
import { createSubCommandFromSchema } from '../../../../shared/commands/utils.js';
import { commandErrorHandler } from '../../../../shared/utils/functions/command-error-handler.js';
import { logger } from '../../../../shared/utils/helpers/logger.js';
import { ChromeClient } from '../../../lib/chrome-client.js';

export function createScreenshotTabCommand(): Command {
  const SCREENSHOT_FORMAT = 'jpeg' as const;
  const SCREENSHOT_QUALITY = 80;

  return createSubCommandFromSchema(
    CommandNames.TAB,
    SubCommandNames.TAB_SCREENSHOT,
    async (options: TabsScreenshotOptions) => {
      const commandPromise = async () => {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab?.toString());

        const format = SCREENSHOT_FORMAT;
        const quality = SCREENSHOT_QUALITY;
        const fullPage = !options.onlyViewport;

        logger.blue('📸 Capturing screenshot...');

        const result = await client.captureScreenshot(tabId, format as 'png' | 'jpeg', quality, fullPage);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const extension = format === 'jpeg' ? 'jpg' : 'png';
        const outputPath = options.output || `screenshot-${timestamp}.${extension}`;

        const base64Data = result.dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const dir = dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });

        await fs.writeFile(outputPath, buffer);

        const absolutePath = resolve(outputPath);

        logger.success('✓ Screenshot saved successfully');
        logger.dim(`  File: ${absolutePath}`);
        logger.dim(`  Size: ${(buffer.length / 1024).toFixed(2)} KB`);
        logger.dim(`  Format: ${format.toUpperCase()}`);
        logger.dim(`  Capture time: ${(result.captureTimeMs / 1000).toFixed(2)}s`);
      };

      await commandPromise().catch(commandErrorHandler('Error capturing screenshot:'));
    }
  );
}
