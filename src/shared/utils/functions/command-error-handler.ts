import { logger } from '../helpers/logger.js';

export function commandErrorHandler(customMessage: string) {
  return (error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : error;
    logger.error(customMessage, errorMessage);
    process.exit(1);
  };
}
