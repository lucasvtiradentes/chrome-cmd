import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
// When compiled, __dirname will be /dist/, so we need to go up one level to reach package.json
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export const APP_INFO = {
  name: 'chrome-cmd',
  version: packageJson.version,
  description: 'Control Chrome from the command line'
};

export const NATIVE_APP_NAME = 'com.chrome_cli.native';
