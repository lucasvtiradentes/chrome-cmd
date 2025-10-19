import { Command } from 'commander';
import { createCommandFromSchema } from '../../../shared/command-builder.js';
import { CommandNames } from '../../../shared/commands-schema.js';
import { createProfileRemoveCommand } from './remove.js';
import { createProfileSelectCommand } from './select.js';

export function createProfileCommand(): Command {
  const profile = createCommandFromSchema(CommandNames.PROFILE);

  profile.addCommand(createProfileRemoveCommand());
  profile.addCommand(createProfileSelectCommand());

  return profile;
}
