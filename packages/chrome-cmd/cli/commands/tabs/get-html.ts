import chalk from 'chalk';
import { Command } from 'commander';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createGetHtmlCommand(): Command {
  const getHtml = new Command('html');
  getHtml
    .description('Extract HTML content from a specific tab')
    .option('--tab <index>', 'Tab index (1-9) (overrides selected tab)')
    .option('--selector <selector>', 'CSS selector to extract specific element (default: "body")')
    .option('--raw', 'Output raw HTML without pretty printing')
    .option(
      '--full',
      'Include hidden tags (SVG and style). By default, these are removed to save tokens and keep output concise'
    )
    .action(async (options: { tab?: string; selector?: string; raw?: boolean; full?: boolean }) => {
      try {
        const client = new ChromeClient();
        const tabId = await client.resolveTabWithConfig(options.tab);
        const selector = options.selector || 'body';
        const pretty = !options.raw; // Pretty by default, unless --raw is specified
        const showFull = options.full || false; // Show full HTML if --full flag is provided

        // Build the script to extract HTML (always use outerHTML)
        let script = `document.querySelector('${selector}')?.outerHTML`;

        // If pretty printing is requested, use a formatting function
        if (pretty) {
          script = `
            (() => {
              const element = document.querySelector('${selector}');
              if (!element) return null;

              const html = element.outerHTML;
              const hideSvg = !${showFull}; // Hide SVG by default, show if --full flag is used
              const hideStyle = !${showFull}; // Hide style by default, show if --full flag is used

              // Void/self-closing elements that don't have closing tags
              const voidElements = new Set([
                'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
                'link', 'meta', 'param', 'source', 'track', 'wbr'
              ]);

              let result = '';
              let indent = 0;
              const indentSize = 2;
              let i = 0;
              let insideSvg = false;
              let svgDepth = 0;
              let insideStyle = false;
              let styleDepth = 0;

              while (i < html.length) {
                // Skip whitespace between tags
                if (html[i] === ' ' || html[i] === '\\n' || html[i] === '\\r' || html[i] === '\\t') {
                  i++;
                  continue;
                }

                // Handle tags
                if (html[i] === '<') {
                  const tagStart = i;
                  i++;

                  // Check if it's a closing tag
                  const isClosing = html[i] === '/';
                  if (isClosing) i++;

                  // Extract tag name
                  let tagName = '';
                  while (i < html.length && html[i] !== ' ' && html[i] !== '>' && html[i] !== '/') {
                    tagName += html[i];
                    i++;
                  }

                  // Find the end of the tag
                  while (i < html.length && html[i] !== '>') {
                    i++;
                  }
                  i++; // Skip '>'

                  const fullTag = html.substring(tagStart, i);
                  const isSelfClosing = fullTag.endsWith('/>') || voidElements.has(tagName.toLowerCase());
                  const isSvgTag = tagName.toLowerCase() === 'svg';
                  const isStyleTag = tagName.toLowerCase() === 'style';

                  // Handle SVG hiding
                  if (hideSvg && isSvgTag) {
                    if (!isClosing) {
                      // Opening SVG tag
                      if (svgDepth === 0) {
                        result += ' '.repeat(indent * indentSize) + '<!-- SVG removed to save tokens -->\\n';
                      }
                      svgDepth++;
                      insideSvg = true;
                    } else {
                      // Closing SVG tag
                      svgDepth--;
                      if (svgDepth === 0) {
                        insideSvg = false;
                      }
                    }
                    continue;
                  }

                  // Handle STYLE hiding
                  if (hideStyle && isStyleTag) {
                    if (!isClosing) {
                      // Opening STYLE tag
                      if (styleDepth === 0) {
                        result += ' '.repeat(indent * indentSize) + '<!-- STYLE removed to save tokens -->\\n';
                      }
                      styleDepth++;
                      insideStyle = true;
                    } else {
                      // Closing STYLE tag
                      styleDepth--;
                      if (styleDepth === 0) {
                        insideStyle = false;
                      }
                    }
                    continue;
                  }

                  // Skip content inside SVG or STYLE
                  if ((hideSvg && insideSvg) || (hideStyle && insideStyle)) {
                    continue;
                  }

                  // Adjust indent for closing tags
                  if (isClosing) {
                    indent = Math.max(0, indent - 1);
                  }

                  // Add indentation and tag
                  result += ' '.repeat(indent * indentSize) + fullTag + '\\n';

                  // Adjust indent for opening tags (but not self-closing)
                  if (!isClosing && !isSelfClosing) {
                    indent++;
                  }
                } else {
                  // Handle text content between tags
                  let text = '';
                  while (i < html.length && html[i] !== '<') {
                    text += html[i];
                    i++;
                  }

                  // Skip text content inside SVG or STYLE
                  if ((hideSvg && insideSvg) || (hideStyle && insideStyle)) {
                    continue;
                  }

                  const trimmed = text.trim();
                  if (trimmed) {
                    result += ' '.repeat(indent * indentSize) + trimmed + '\\n';
                  }
                }
              }

              return result.trim();
            })()
          `;
        }

        const html = await client.executeScript(tabId, script);

        if (!html) {
          console.error(chalk.red(`Error: Element not found with selector "${selector}"`));
          process.exit(1);
        }

        console.log(chalk.green('✓ HTML extracted successfully'));
        console.log(chalk.gray(`  Selector: ${selector}`));
        console.log(chalk.gray(`  Format: ${pretty ? 'Pretty (formatted)' : 'Raw'}`));
        console.log(chalk.gray(`  Size: ${(html as string).length} characters`));
        console.log('');
        console.log(chalk.bold('HTML Content:'));
        console.log(chalk.dim('─'.repeat(80)));
        console.log(html);
        console.log(chalk.dim('─'.repeat(80)));
      } catch (error) {
        console.error(chalk.red('Error extracting HTML:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return getHtml;
}
