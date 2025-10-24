export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function getErrorMessage(error: unknown): string {
  return formatErrorMessage(error);
}
