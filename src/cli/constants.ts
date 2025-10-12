import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NATIVE_APP_NAME, NATIVE_MANIFEST_FILENAME } from '../shared/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
// When in dev mode (tsx), __dirname is src/cli/, need to go up 2 levels
// When compiled, __dirname is dist/cli/, also need to go up 2 levels
const packageJsonPath = join(__dirname, '..', '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export const APP_INFO = {
  name: 'chrome-cmd',
  version: packageJson.version,
  description: 'Control Chrome from the command line'
};

// Re-export shared constants
export { NATIVE_APP_NAME, NATIVE_MANIFEST_FILENAME };
