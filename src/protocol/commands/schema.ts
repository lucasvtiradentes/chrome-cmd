import { completionCommandDefinition } from './definitions/completion.js';
import { installCommandDefinition } from './definitions/install.js';
import { profileCommandDefinition } from './definitions/profile.js';
import { tabCommandDefinition } from './definitions/tab.js';
import { updateCommandDefinition } from './definitions/update.js';
import type { Command } from './definitions.js';

export const COMMANDS_SCHEMA: Command[] = [
  tabCommandDefinition,
  profileCommandDefinition,
  installCommandDefinition,
  updateCommandDefinition,
  completionCommandDefinition
];
