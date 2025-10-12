import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

interface Config {
  extensionId?: string;
}

export class ConfigManager {
  private configPath: string;
  private config: Config;

  constructor() {
    const configDir = path.join(homedir(), '.chrome-cmd');
    this.configPath = path.join(configDir, 'config.json');

    // Ensure config directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    // Load existing config or create new one
    this.config = this.load();
  }

  private load(): Config {
    try {
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    return {};
  }

  private save(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  getExtensionId(): string | undefined {
    return this.config.extensionId;
  }

  setExtensionId(extensionId: string): void {
    this.config.extensionId = extensionId;
    this.save();
  }

  clearExtensionId(): void {
    this.config.extensionId = undefined;
    this.save();
  }

  getConfigPath(): string {
    return this.configPath;
  }
}

// Singleton instance
export const configManager = new ConfigManager();
