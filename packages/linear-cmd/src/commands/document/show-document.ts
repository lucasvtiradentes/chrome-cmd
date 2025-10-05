import { Command } from 'commander';
import { LinearAPIClient } from '../../lib/linear-client.js';
import { Logger } from '../../lib/logger.js';

export function createShowDocumentCommand(): Command {
  return new Command('show')
    .arguments('<idOrUrl>')
    .description('Show detailed information about a document')
    .option('-f, --format <format>', 'Output format (default: pretty)', 'pretty')
    .action(async (idOrUrl: string, options) => {
      try {
        const linearClient = new LinearAPIClient();

        Logger.loading('Fetching document details...');
        const documentData = await linearClient.getDocumentByIdOrUrl(idOrUrl);

        if (options.format === 'json') {
          Logger.json(documentData);
        } else {
          Logger.plain(linearClient.formatDocument(documentData));
        }
      } catch (error) {
        Logger.error('Error fetching document', error);
        process.exit(1);
      }
    });
}
