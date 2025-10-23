import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function isDev(): boolean {
  const isGlobalInstall = __dirname.includes('/node_modules/');
  return !isGlobalInstall && process.env.NODE_ENV !== 'production';
}
