import { accessSync, constants, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { PathHelper } from './path.helper.js';

export function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    }
  } catch {}
  return defaultValue;
}

export function writeJsonFile<T>(filePath: string, data: T): void {
  PathHelper.ensureDir(filePath);
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function findFirstWritableDir(dirs: string[]): string | null {
  for (const dir of dirs) {
    if (existsSync(dir)) {
      try {
        accessSync(dir, constants.W_OK);
        return dir;
      } catch {}
    }
  }
  return null;
}

export function findFirstExistingPath(paths: string[]): string | null {
  for (const path of paths) {
    if (existsSync(path)) {
      return path;
    }
  }
  return null;
}
