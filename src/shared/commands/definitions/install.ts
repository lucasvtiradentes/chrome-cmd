import { CLI_NAME } from '../../constants/constants';
import { type Command, CommandNames } from '../cli-command';

export const installCommandDefinition: Command = {
  name: CommandNames.INSTALL,
  description: 'Install Chrome CMD extension and setup native messaging',
  examples: [`${CLI_NAME} install`]
};
