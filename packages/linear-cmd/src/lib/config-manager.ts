import * as fs from 'fs';

import { CONFIG_PATHS } from '../constants.js';
import type { Account, LinearConfig, UserMetadata } from '../types/local.js';
import { linearConfigSchema, userMetadataSchema } from '../types/local.js';
import { readJson5, writeJson5 } from '../utils/json-utils.js';

export class ConfigManager {
  private userMetadata: UserMetadata | null = null;
  private config: LinearConfig | null = null;

  constructor() {
    this.ensureConfigDirectory();
    this.initializeUserMetadata();
  }

  private ensureConfigDirectory(): void {
    if (!fs.existsSync(CONFIG_PATHS.configDir)) {
      fs.mkdirSync(CONFIG_PATHS.configDir, { recursive: true });
    }
  }

  private initializeUserMetadata(): void {
    if (!fs.existsSync(CONFIG_PATHS.userMetadataFile)) {
      this.createDefaultUserMetadata();
    }
    this.loadUserMetadata();
  }

  private createDefaultUserMetadata(): void {
    const defaultMetadata: UserMetadata = {
      config_path: CONFIG_PATHS.defaultConfigFile
    };
    writeJson5(CONFIG_PATHS.userMetadataFile, defaultMetadata);
  }

  private loadUserMetadata(): void {
    try {
      const data = readJson5<UserMetadata>(CONFIG_PATHS.userMetadataFile);
      const validated = userMetadataSchema.parse(data);
      this.userMetadata = validated;
    } catch (error) {
      throw new Error(`Failed to load user metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getConfigPath(): string {
    if (!this.userMetadata) {
      throw new Error('User metadata not loaded');
    }
    return this.userMetadata.config_path;
  }

  private loadConfig(): LinearConfig {
    if (this.config) {
      return this.config;
    }

    const configPath = this.getConfigPath();

    if (!fs.existsSync(configPath)) {
      this.createDefaultConfig();
    }

    try {
      const data = readJson5<LinearConfig>(configPath);
      const validated = linearConfigSchema.parse(data);
      this.config = validated;
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createDefaultConfig(): void {
    const defaultConfig: LinearConfig = {
      accounts: {}
    };

    const configPath = this.getConfigPath();
    writeJson5(configPath, defaultConfig);
  }

  private saveConfig(): void {
    if (!this.config) {
      throw new Error('No config to save');
    }

    const configPath = this.getConfigPath();
    writeJson5(configPath, this.config);
  }

  // Public API Methods

  async addAccount(name: string, apiKey: string, teamId?: string): Promise<void> {
    const config = this.loadConfig();

    if (config.accounts[name]) {
      throw new Error(`Account '${name}' already exists`);
    }

    const account: Account = {
      name,
      api_key: apiKey,
      team_id: teamId
    };

    config.accounts[name] = account;

    // No longer set as active automatically

    this.saveConfig();
  }

  async removeAccount(name: string): Promise<void> {
    const config = this.loadConfig();

    if (!config.accounts[name]) {
      throw new Error(`Account '${name}' not found`);
    }

    delete config.accounts[name];

    // No longer manage active account

    this.saveConfig();
  }

  // Active account methods removed - accounts must be specified explicitly

  getAllAccounts(): Account[] {
    const config = this.loadConfig();
    return Object.values(config.accounts);
  }

  getAccount(name: string): Account | null {
    const config = this.loadConfig();
    return config.accounts[name] || null;
  }

  listAccounts(): Array<{ name: string; teamId?: string }> {
    const config = this.loadConfig();

    return Object.entries(config.accounts).map(([name, account]) => ({
      name,
      teamId: account.team_id
    }));
  }

  updateAccountApiKey(name: string, apiKey: string): void {
    const config = this.loadConfig();

    if (!config.accounts[name]) {
      throw new Error(`Account '${name}' not found`);
    }

    config.accounts[name].api_key = apiKey;
    this.saveConfig();
  }

  findAccountByWorkspace(workspace: string): Account | null {
    const accounts = this.getAllAccounts();
    return accounts.find((a) => a.workspaces?.includes(workspace)) || null;
  }

  async updateAccountWorkspaces(accountId: string, workspaces: string[]): Promise<void> {
    const config = this.loadConfig();

    if (!config.accounts[accountId]) {
      throw new Error(`Account '${accountId}' not found`);
    }

    config.accounts[accountId].workspaces = workspaces;
    this.saveConfig();
  }

  markCompletionInstalled(): void {
    const config = this.loadConfig();
    if (!config.settings) {
      config.settings = {};
    }
    config.settings.completion_installed = true;
    this.saveConfig();
  }

  isCompletionInstalled(): boolean {
    const config = this.loadConfig();
    return config.settings?.completion_installed === true;
  }
}
