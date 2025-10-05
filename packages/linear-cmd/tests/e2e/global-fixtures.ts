import fs from 'fs';
import os from 'os';
import path from 'path';

export interface GlobalFixtures {
  projectUrl: string;
  documentUrl: string;
  issueUrl: string;
  accountName: string;
  testHomeDir: string;
}

const FIXTURES_FILE = path.join(os.tmpdir(), 'linear-cmd-e2e-fixtures.json');

export function saveGlobalFixtures(fixtures: GlobalFixtures): void {
  fs.writeFileSync(FIXTURES_FILE, JSON.stringify(fixtures, null, 2));
}

export function loadGlobalFixtures(): GlobalFixtures | null {
  try {
    if (!fs.existsSync(FIXTURES_FILE)) {
      return null;
    }
    const content = fs.readFileSync(FIXTURES_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load global fixtures:', error);
    return null;
  }
}

export function clearGlobalFixtures(): void {
  if (fs.existsSync(FIXTURES_FILE)) {
    fs.unlinkSync(FIXTURES_FILE);
  }
}
