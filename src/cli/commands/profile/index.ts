import { Command } from 'commander';
import { CommandNames } from '../../../shared/commands/cli-command.js';
import { createCommandFromSchema } from '../../../shared/utils/helpers/command-builder.js';
import { createProfileRemoveCommand } from './remove.js';
import { createProfileSelectCommand } from './select.js';

export function createProfileCommand(): Command {
  const profile = createCommandFromSchema(CommandNames.PROFILE);

  profile.addCommand(createProfileRemoveCommand());
  profile.addCommand(createProfileSelectCommand());

  return profile;
}
