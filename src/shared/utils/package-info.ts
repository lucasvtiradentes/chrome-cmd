import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findPackageRoot(startDir: string): string {
  let current = startDir;
  while (current !== '/') {
    const packageJsonPath = join(current, 'package.json');
    if (existsSync(packageJsonPath)) {
      return current;
    }
    current = dirname(current);
  }
  throw new Error('package.json not found');
}

const packageRoot = findPackageRoot(__dirname);
const packageJsonPath = join(packageRoot, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export function getPackageInfo() {
  return {
    name: packageJson.name as string,
    version: packageJson.version as string,
    description: packageJson.description as string,
    root: packageRoot
  };
}
