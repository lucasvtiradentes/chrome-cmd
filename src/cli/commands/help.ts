import { generateHelp } from '../../protocol/commands/generators/help-generator.js';
import { logger } from '../../shared/utils/helpers/logger.js';

export function displayHelp(): void {
  logger.info(generateHelp());
}
