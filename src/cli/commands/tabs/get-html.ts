import chalk from 'chalk';
import { Command } from 'commander';
import { createSubCommandFromSchema, type TabsHtmlOptions } from '../../../shared/commands/command-builder.js';
import { CommandNames, SubCommandNames } from '../../../shared/commands/commands-schema.js';
import { ChromeClient } from '../../lib/chrome-client.js';

export function createGetHtmlCommand(): Command {
  return createSubCommandFromSchema(CommandNames.TABS, SubCommandNames.TABS_HTML, async (options: TabsHtmlOptions) => {
    try {
      const client = new ChromeClient();
      const tabId = await client.resolveTabWithConfig(options.tab?.toString());
      const selector = options.selector || 'body';
      const pretty = !options.raw;
      const showFull = options.full || false;

      let script = `document.querySelector('${selector}')?.outerHTML`;

      if (pretty) {
        script = `
            (() => {
              const element = document.querySelector('${selector}');
              if (!element) return null;

              const html = element.outerHTML;
              const hideSvg = !${showFull};
              const hideStyle = !${showFull};

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

                if (html[i] === ' ' || html[i] === '\\n' || html[i] === '\\r' || html[i] === '\\t') {
                  i++;
                  continue;
                }

                if (html[i] === '<') {
                  const tagStart = i;
                  i++;

                  const isClosing = html[i] === '/';
                  if (isClosing) i++;

                  let tagName = '';
                  while (i < html.length && html[i] !== ' ' && html[i] !== '>' && html[i] !== '/') {
                    tagName += html[i];
                    i++;
                  }

                  while (i < html.length && html[i] !== '>') {
                    i++;
                  }
                  i++;

                  const fullTag = html.substring(tagStart, i);
                  const isSelfClosing = fullTag.endsWith('/>') || voidElements.has(tagName.toLowerCase());
                  const isSvgTag = tagName.toLowerCase() === 'svg';
                  const isStyleTag = tagName.toLowerCase() === 'style';

                  if (hideSvg && isSvgTag) {
                    if (!isClosing) {

                      if (svgDepth === 0) {
                        result += ' '.repeat(indent * indentSize) + '<!-- SVG removed to save tokens -->\\n';
                      }
                      svgDepth++;
                      insideSvg = true;
                    } else {

                      svgDepth--;
                      if (svgDepth === 0) {
                        insideSvg = false;
                      }
                    }
                    continue;
                  }

                  if (hideStyle && isStyleTag) {
                    if (!isClosing) {

                      if (styleDepth === 0) {
                        result += ' '.repeat(indent * indentSize) + '<!-- STYLE removed to save tokens -->\\n';
                      }
                      styleDepth++;
                      insideStyle = true;
                    } else {

                      styleDepth--;
                      if (styleDepth === 0) {
                        insideStyle = false;
                      }
                    }
                    continue;
                  }

                  if ((hideSvg && insideSvg) || (hideStyle && insideStyle)) {
                    continue;
                  }

                  if (isClosing) {
                    indent = Math.max(0, indent - 1);
                  }

                  result += ' '.repeat(indent * indentSize) + fullTag + '\\n';

                  if (!isClosing && !isSelfClosing) {
                    indent++;
                  }
                } else {

                  let text = '';
                  while (i < html.length && html[i] !== '<') {
                    text += html[i];
                    i++;
                  }

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
}
