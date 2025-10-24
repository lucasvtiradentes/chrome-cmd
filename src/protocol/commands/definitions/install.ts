import { APP_NAME, CLI_NAME } from '../../../shared/constants/constants.js';
import { type Command, CommandNames } from '../definitions.js';

export const installCommandDefinition: Command = {
  name: CommandNames.INSTALL,
  description: `Install ${APP_NAME} extension and setup bridge`,
  examples: [`${CLI_NAME} install`]
};
