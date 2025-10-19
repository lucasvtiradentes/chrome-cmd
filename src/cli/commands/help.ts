import { generateHelp } from '../../shared/commands/generators/help-generator.js';

export function displayHelp(): void {
  console.log(generateHelp());
}
