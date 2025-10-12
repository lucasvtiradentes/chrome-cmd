import { generateHelp } from '../../shared/generators/help-generator.js';

export function displayHelp(): void {
  console.log(generateHelp());
}
