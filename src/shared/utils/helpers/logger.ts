import { colors } from './colors.js';

class Logger {
  info(message: string): void {
    console.log(message);
  }

  success(message: string): void {
    console.log(colors.green(message));
  }

  error(message: string, error?: unknown): void {
    if (error !== undefined) {
      console.error(colors.red(message), error);
    } else {
      console.error(colors.red(message));
    }
  }

  warning(message: string): void {
    console.log(colors.yellow(message));
  }

  dim(message: string): void {
    console.log(colors.dim(message));
  }

  blue(message: string): void {
    console.log(colors.blue(message));
  }

  cyan(message: string): void {
    console.log(colors.cyan(message));
  }

  bold(message: string): void {
    console.log(colors.bold(message));
  }

  newline(): void {
    console.log('');
  }

  raw(message: string): void {
    console.log(message);
  }

  divider(length = 80): void {
    console.log(colors.dim('─'.repeat(length)));
  }

  green(message: string): string {
    return colors.green(message);
  }

  red(message: string): string {
    return colors.red(message);
  }

  yellow(message: string): string {
    return colors.yellow(message);
  }
}

export const logger = new Logger();
