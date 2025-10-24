import { APP_NAME, CLI_NAME } from '../../../shared/constants/constants';
import { type Command, CommandNames } from '../definitions';

export const installCommandDefinition: Command = {
  name: CommandNames.INSTALL,
  description: `Install ${APP_NAME} extension and setup bridge`,
  examples: [`${CLI_NAME} install`]
};
