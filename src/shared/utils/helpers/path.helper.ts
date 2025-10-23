import { existsSync, mkdirSync } from 'node:fs';
import { platform } from 'node:os';
import { dirname } from 'node:path';

export class PathHelper {
  static isWindows() {
    return platform() === 'win32';
  }

  static isMac() {
    return platform() === 'darwin';
  }

  static isLinux() {
    return platform() === 'linux';
  }

  static ensureDir(filePath: string) {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}
