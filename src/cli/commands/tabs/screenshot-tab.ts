import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import { createSubCommandFromSchema, type TabsScreenshotOptions } from '../../../shared/command-builder.js';
import { CommandNames, SubCommandNames } from '../../../shared/commands-schema.js';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createScreenshotTabCommand(): Command {
  const SCREENSHOT_FORMAT = 'jpeg' as const;
  const SCREENSHOT_QUALITY = 80;

  return createSubCommandFromSchema(
    CommandNames.TABS,
    SubCommandNames.TABS_SCREENSHOT,
    async (options: TabsScreenshotOptions) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab?.toString());

        const format = SCREENSHOT_FORMAT;
        const quality = SCREENSHOT_QUALITY;
        const fullPage = !options.onlyViewport; // By default capture full page

        console.log(chalk.blue('📸 Capturing screenshot...'));

        const result = await client.captureScreenshot(tabId, format as 'png' | 'jpeg', quality, fullPage);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const extension = format === 'jpeg' ? 'jpg' : 'png';
        const outputPath = options.output || `screenshot-${timestamp}.${extension}`;

        const base64Data = result.dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });

        await fs.writeFile(outputPath, buffer);

        const absolutePath = path.resolve(outputPath);

        console.log(chalk.green('✓ Screenshot saved successfully'));
        console.log(chalk.gray(`  File: ${absolutePath}`));
        console.log(chalk.gray(`  Size: ${(buffer.length / 1024).toFixed(2)} KB`));
        console.log(chalk.gray(`  Format: ${format.toUpperCase()}`));
        console.log(chalk.gray(`  Capture time: ${(result.captureTimeMs / 1000).toFixed(2)}s`));
      } catch (error) {
        console.error(chalk.red('Error capturing screenshot:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }
  );
}
