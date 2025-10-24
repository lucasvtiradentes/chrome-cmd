import { CLI_NAME } from '../../../shared/constants/constants.js';
import { type Command, CommandNames } from '../definitions.js';

export const updateCommandDefinition: Command = {
  name: CommandNames.UPDATE,
  description: `Update ${CLI_NAME} to latest version`,
  examples: [`${CLI_NAME} update`]
};
