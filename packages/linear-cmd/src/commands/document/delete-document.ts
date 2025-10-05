import { Command } from 'commander';
import inquirer from 'inquirer';
import { LinearAPIClient } from '../../lib/linear-client.js';
import { Logger } from '../../lib/logger.js';

export function createDeleteDocumentCommand(): Command {
  return new Command('delete')
    .description('Delete a Linear document')
    .argument('<idOrUrl>', 'document ID or URL')
    .option('-y, --yes', 'skip confirmation prompt')
    .action(async (idOrUrl: string, options) => {
      try {
        const linearClient = new LinearAPIClient();

        // Get document details first
        Logger.loading('Fetching document details...');
        const document = await linearClient.getDocumentByIdOrUrl(idOrUrl);

        // Confirm deletion unless --yes flag is used
        if (!options.yes) {
          const answer = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete document "${document.title}"?`,
              default: false
            }
          ]);

          if (!answer.confirm) {
            Logger.info('Document deletion cancelled');
            return;
          }
        }

        // Delete the document
        Logger.loading('Deleting document...');
        await linearClient.deleteDocument(idOrUrl);

        Logger.success(`Document "${document.title}" deleted successfully!`);
      } catch (error) {
        Logger.error('Error deleting document', error);
        process.exit(1);
      }
    });
}
