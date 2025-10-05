import { Command } from 'commander';

import { createAddAccountCommand } from './add-account.js';
import { createListAccountsCommand } from './list-accounts.js';
import { createRemoveAccountCommand } from './remove-account.js';
import { createTestAccountsCommand } from './test-accounts.js';

export function createAccountCommand(): Command {
  const account = new Command('account');
  account.description('Manage Linear accounts');

  account.addCommand(createAddAccountCommand());
  account.addCommand(createListAccountsCommand());
  account.addCommand(createRemoveAccountCommand());
  account.addCommand(createTestAccountsCommand());

  return account;
}
