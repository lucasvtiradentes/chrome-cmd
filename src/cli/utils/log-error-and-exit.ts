import { logger } from '../../shared/utils/helpers/logger.js';

export function logErrorAndExit(message: string, error?: unknown): never {
  const errorMessage = error instanceof Error ? error.message : error;
  logger.error(message, errorMessage);
  process.exit(1);
}
