import { CLI_NAME } from '../../constants/constants';
import { type Command, CommandNames, SubCommandNames } from '../definitions';

export const profileCommandDefinition: Command = {
  name: CommandNames.PROFILE,
  description: 'Manage extension profiles',
  subcommands: [
    {
      name: SubCommandNames.PROFILE_REMOVE,
      description: 'Remove profile and native host configuration',
      examples: [`${CLI_NAME} profile remove`]
    },
    {
      name: SubCommandNames.PROFILE_SELECT,
      description: 'Select active profile from configured profiles',
      examples: [`${CLI_NAME} profile select`]
    }
  ]
};
