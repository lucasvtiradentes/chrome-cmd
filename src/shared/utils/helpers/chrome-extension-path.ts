import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function getExtensionPhysicalPath(extensionId: string): string | null {
  const home = homedir();
  const chromePaths = [
    join(home, '.config', 'google-chrome'),
    join(home, '.config', 'chromium'),
    join(home, 'Library', 'Application Support', 'Google', 'Chrome'),
    join(home, 'AppData', 'Local', 'Google', 'Chrome', 'User Data')
  ];

  for (const chromePath of chromePaths) {
    if (!existsSync(chromePath)) continue;

    try {
      const entries = readdirSync(chromePath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (!entry.name.includes('Profile') && entry.name !== 'Default') continue;

        const preferencesPath = join(chromePath, entry.name, 'Preferences');
        if (!existsSync(preferencesPath)) continue;

        try {
          const preferences = JSON.parse(readFileSync(preferencesPath, 'utf-8'));
          const extensionSettings = preferences?.extensions?.settings;

          if (extensionSettings?.[extensionId]) {
            const path = extensionSettings[extensionId].path;
            if (path && typeof path === 'string') {
              return path;
            }
          }
        } catch {}
      }
    } catch {}
  }

  return null;
}
