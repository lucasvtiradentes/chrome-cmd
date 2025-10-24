import { chmodSync } from 'node:fs';
import { PathHelper } from '../helpers/path.helper.js';

export function makeFileExecutable(filePath: string): void {
  if (PathHelper.isWindows()) {
    return;
  }

  try {
    const FILE_PERMISSIONS_EXECUTABLE = 0o755;
    chmodSync(filePath, FILE_PERMISSIONS_EXECUTABLE);
  } catch (_error) {
    throw new Error(`Failed to make file executable: ${filePath}`);
  }
}
