import { Command } from 'commander';
import { CommandNames } from '../../../protocol/commands/definitions.js';
import { createCommandFromSchema } from '../../../protocol/commands/utils.js';
import { createProfileRemoveCommand } from './remove.js';
import { createProfileSelectCommand } from './select.js';

export function createProfileCommand(): Command {
  const profile = createCommandFromSchema(CommandNames.PROFILE);

  profile.addCommand(createProfileRemoveCommand());
  profile.addCommand(createProfileSelectCommand());

  return profile;
}
