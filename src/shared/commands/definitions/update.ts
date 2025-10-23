import { CLI_NAME } from '../../constants/constants';
import { type Command, CommandNames } from '../definitions';

export const updateCommandDefinition: Command = {
  name: CommandNames.UPDATE,
  description: `Update ${CLI_NAME} to latest version`,
  examples: [`${CLI_NAME} update`]
};
