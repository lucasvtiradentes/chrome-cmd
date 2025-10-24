import { logErrorAndExit } from '../../utils/log-error-and-exit.js';

export function commandErrorHandler(customMessage: string) {
  return (error: unknown) => {
    logErrorAndExit(customMessage, error);
  };
}
