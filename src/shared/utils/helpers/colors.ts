import chalk from 'chalk';

export const colors = {
  red: (text: string) => chalk.red(text),
  green: (text: string) => chalk.green(text),
  blue: (text: string) => chalk.blue(text),
  yellow: (text: string) => chalk.yellow(text),
  cyan: (text: string) => chalk.cyan(text),
  gray: (text: string) => chalk.gray(text),
  white: (text: string) => chalk.white(text),
  dim: (text: string) => chalk.dim(text),
  bold: (text: string) => chalk.bold(text)
};
