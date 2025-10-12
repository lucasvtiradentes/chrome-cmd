import { generateHelp } from '../../shared/generators/help-generator';

export function displayHelp(): void {
  console.log(generateHelp());
}
