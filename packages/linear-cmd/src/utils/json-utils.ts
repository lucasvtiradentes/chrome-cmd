import * as fs from 'fs';
import JSON5 from 'json5';

export function readJson5<T = Record<string, unknown>>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON5.parse(rawData) as T;
  } catch (error) {
    throw new Error(
      `Failed to parse JSON5 file: ${filePath}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function writeJson5<T>(filePath: string, data: T, pretty = true): void {
  try {
    const jsonString = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    fs.writeFileSync(filePath, jsonString, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to write JSON5 file: ${filePath}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
