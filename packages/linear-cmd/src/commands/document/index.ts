import { Command } from 'commander';

import { createAddDocumentCommand } from './add-document.js';
import { createDeleteDocumentCommand } from './delete-document.js';
import { createShowDocumentCommand } from './show-document.js';

export function createDocumentCommand(): Command {
  const document = new Command('document');
  document.description('Manage Linear documents');

  document.addCommand(createShowDocumentCommand());
  document.addCommand(createAddDocumentCommand());
  document.addCommand(createDeleteDocumentCommand());

  return document;
}
