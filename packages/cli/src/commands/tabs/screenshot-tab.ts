import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import { ChromeClient } from '../../lib/chrome-client.js';

// Screenshot configuration constants
const SCREENSHOT_FORMAT = 'png' as const;
const SCREENSHOT_QUALITY = 90;

export function createScreenshotTabCommand(): Command {
  const screenshotTab = new Command('screenshot');
  screenshotTab
    .description('Capture screenshot of a tab')
    .option('--tab <index>', 'Tab index (1-9) (overrides selected tab)')
    .option('--output <path>', 'Output file path (default: screenshot-<timestamp>.png)')
    .action(async (options: { tab?: string; output?: string }) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab);

        const format = SCREENSHOT_FORMAT;
        const quality = SCREENSHOT_QUALITY;

        console.log(chalk.blue('📸 Capturing screenshot...'));

        // Capture screenshot
        const result = await client.captureScreenshot(tabId, format as 'png' | 'jpeg', quality);

        // Generate output path if not provided
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const extension = format === 'png' ? 'png' : 'jpg';
        const outputPath = options.output || `screenshot-${timestamp}.${extension}`;

        // Convert data URL to buffer
        const base64Data = result.dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });

        // Write file
        await fs.writeFile(outputPath, buffer);

        console.log(chalk.green('✓ Screenshot saved successfully'));
        console.log(chalk.gray(`  File: ${outputPath}`));
        console.log(chalk.gray(`  Size: ${(buffer.length / 1024).toFixed(2)} KB`));
        console.log(chalk.gray(`  Format: ${format.toUpperCase()}`));
        console.log(chalk.gray(`  Capture time: ${(result.captureTimeMs / 1000).toFixed(2)}s`));
      } catch (error) {
        console.error(chalk.red('Error capturing screenshot:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return screenshotTab;
}
