import { formatErrorMessage } from '../../shared/utils/helpers/error-utils.js';
import { logger } from '../../shared/utils/helpers/logger.js';

export function logErrorAndExit(message: string, error?: unknown): never {
  const errorMessage = formatErrorMessage(error);
  logger.error(message, errorMessage);
  process.exit(1);
}
