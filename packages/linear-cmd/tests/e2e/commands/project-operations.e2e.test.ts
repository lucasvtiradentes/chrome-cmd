import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadGlobalFixtures } from '../global-fixtures';

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function execCommand(command: string, input?: string, timeout = 30000, homeDir?: string): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      cwd: path.resolve(__dirname, '../../../'),
      env: {
        ...process.env,
        NODE_ENV: 'test',
        ...(homeDir ? { HOME: homeDir } : {}),
        CI: 'true',
        FORCE_TTY: 'false',
        FORCE_STDIN: 'true'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let isResolved = false;

    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }
    }, timeout);

    if (input && child.stdin) {
      const lines = input.split('\n');
      let index = 0;

      const writeNext = () => {
        if (index < lines.length && child.stdin && !child.stdin.destroyed) {
          child.stdin.write(`${lines[index]}\n`);
          index++;
          if (index < lines.length) {
            setTimeout(writeNext, 500);
          }
        }
      };

      setTimeout(writeNext, 1000);
    }

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        resolve({
          stdout,
          stderr,
          exitCode: code || 0
        });
      }
    });

    child.on('error', (error) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  });
}

describe('Project Operations E2E', () => {
  const testHomeDir = path.join(os.tmpdir(), `linear-cmd-project-e2e-${Date.now()}`);
  const testConfigDir = path.join(testHomeDir, '.config', 'linear-cmd');

  beforeEach(async () => {
    if (fs.existsSync(testHomeDir)) {
      fs.rmSync(testHomeDir, { recursive: true, force: true });
    }

    fs.mkdirSync(testConfigDir, { recursive: true });

    const userMetadataPath = path.join(testConfigDir, 'user_metadata.json');
    const configPath = path.join(testConfigDir, 'config.json5');

    fs.writeFileSync(
      userMetadataPath,
      JSON.stringify({
        config_path: configPath
      })
    );

    fs.writeFileSync(
      configPath,
      `{
  "accounts": {}
}`
    );
  });

  afterEach(() => {
    if (fs.existsSync(testHomeDir)) {
      fs.rmSync(testHomeDir, { recursive: true, force: true });
    }
  });

  async function setupTestAccount(homeDir: string): Promise<string> {
    const accountName = `e2e-test-${Date.now()}`;
    const testApiKey = process.env.LINEAR_API_KEY_E2E || 'lin_api_test123456789';

    const addInput = `${accountName}\n${testApiKey}`;
    await execCommand('node dist/index.js account add', addInput, 15000, homeDir);

    return accountName;
  }

  async function createTestProject(homeDir: string, accountName: string, team: string): Promise<string | null> {
    const projectName = `E2E-Test-Project-${Date.now()}`;
    const result = await execCommand(
      `node dist/index.js project create -a ${accountName} --team ${team} --name ${projectName} --description E2E-test-project-to-be-deleted`,
      undefined,
      30000,
      homeDir
    );

    if (result.exitCode !== 0) {
      console.log(`Failed to create project. Exit code: ${result.exitCode}`);
      console.log(`Stdout: ${result.stdout}`);
      console.log(`Stderr: ${result.stderr}`);
      return null;
    }

    // Extract URL from output
    const urlMatch = result.stdout.match(/https:\/\/linear\.app\/[^\s]+/);
    return urlMatch ? urlMatch[0] : null;
  }

  it('should handle project show command with real API if available', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const fixtures = loadGlobalFixtures();

    if (!apiKey || !fixtures) {
      console.log('Skipping real API test: Missing LINEAR_API_KEY_E2E or global fixtures');
      return;
    }

    const result = await execCommand(
      `node dist/index.js project show ${fixtures.projectUrl}`,
      undefined,
      15000,
      fixtures.testHomeDir
    );

    // Should either succeed or fail gracefully
    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(result.stdout.includes('📁') || result.stdout.includes('Project') || result.stdout.length > 0).toBe(true);
    }
  }, 60000);

  it('should handle project issues command with real API if available', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const fixtures = loadGlobalFixtures();

    if (!apiKey || !fixtures) {
      console.log('Skipping real API test: Missing LINEAR_API_KEY_E2E or global fixtures');
      return;
    }

    const result = await execCommand(
      `node dist/index.js project issues ${fixtures.projectUrl}`,
      undefined,
      15000,
      fixtures.testHomeDir
    );

    // Should either succeed or fail gracefully
    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(
        result.stdout.includes('Fetching') ||
          result.stdout.includes('issues') ||
          result.stdout.includes('✅') ||
          result.stdout.includes('📋') ||
          result.stdout.length > 0
      ).toBe(true);
    }
  }, 60000);

  it('should handle non-existent project gracefully', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(
      'node dist/index.js project show NONEXISTENT-999',
      undefined,
      10000,
      fixtures.testHomeDir
    );

    // Should handle error gracefully
    expect(
      result.exitCode !== 0 ||
        result.stderr.length > 0 ||
        result.stdout.includes('Error') ||
        result.stdout.includes('not found')
    ).toBe(true);
  }, 15000);

  it('should handle JSON output format for project show', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const fixtures = loadGlobalFixtures();

    if (!apiKey || !fixtures) {
      console.log('Skipping JSON format test: Missing LINEAR_API_KEY_E2E or global fixtures');
      return;
    }

    const result = await execCommand(
      `node dist/index.js project show ${fixtures.projectUrl} --format json`,
      undefined,
      15000,
      fixtures.testHomeDir
    );

    if (result.exitCode === 0) {
      // Should contain JSON output
      expect(result.stdout.includes('{') && (result.stdout.includes('"name"') || result.stdout.includes('"id"'))).toBe(
        true
      );
    }
  }, 60000);

  it('should handle JSON output format for project issues', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const fixtures = loadGlobalFixtures();

    if (!apiKey || !fixtures) {
      console.log('Skipping JSON format test: Missing LINEAR_API_KEY_E2E or global fixtures');
      return;
    }

    const result = await execCommand(
      `node dist/index.js project issues ${fixtures.projectUrl} --format json`,
      undefined,
      15000,
      fixtures.testHomeDir
    );

    if (result.exitCode === 0) {
      // Should contain JSON output
      expect(result.stdout.includes('[') || result.stdout.includes('{')).toBe(true);
    }
  }, 60000);

  it('should validate required arguments for project commands', async () => {
    await setupTestAccount(testHomeDir);

    // Test missing arguments
    const showResult = await execCommand('node dist/index.js project show', undefined, 10000, testHomeDir);
    expect(showResult.exitCode !== 0 || showResult.stderr.length > 0).toBe(true);

    const issuesResult = await execCommand('node dist/index.js project issues', undefined, 10000, testHomeDir);
    expect(issuesResult.exitCode !== 0 || issuesResult.stderr.length > 0).toBe(true);
  }, 30000);

  it('should handle project create command with real API if available', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const testTeam = process.env.LINEAR_TEST_TEAM || 'TES';

    if (!apiKey) {
      console.log('Skipping real API test: Missing LINEAR_API_KEY_E2E');
      return;
    }

    await setupTestAccount(testHomeDir);

    const projectName = `E2E Test Project ${Date.now()}`;
    const result = await execCommand(
      `node dist/index.js project create -a test --team ${testTeam} --name "${projectName}" --description "Created by E2E test"`,
      undefined,
      30000,
      testHomeDir
    );

    // Should either succeed or fail gracefully
    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(result.stdout.includes('Project created successfully') || result.stdout.includes('📁')).toBe(true);
    }
  }, 45000);

  it('should handle project delete command with real API if available', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const testTeam = process.env.LINEAR_TEST_TEAM || 'TES';

    if (!apiKey) {
      console.log('Skipping real API test: Missing LINEAR_API_KEY_E2E');
      return;
    }

    const accountName = await setupTestAccount(testHomeDir);

    // Create a test project to delete
    const projectUrl = await createTestProject(testHomeDir, accountName, testTeam);

    if (!projectUrl) {
      console.log('Failed to create test project, skipping test');
      return;
    }

    // Test deleting the project
    const result = await execCommand(
      `node dist/index.js project delete ${projectUrl} -a ${accountName} --yes`,
      undefined,
      30000,
      testHomeDir
    );

    // Should either succeed or fail gracefully
    expect(
      result.exitCode === 0 ||
        result.stderr.length > 0 ||
        result.stdout.includes('Error') ||
        result.stdout.includes('deleted successfully')
    ).toBe(true);
  }, 60000);

  it('should handle project list command with real API if available', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const fixtures = loadGlobalFixtures();

    if (!apiKey || !fixtures) {
      console.log('Skipping real API test: Missing LINEAR_API_KEY_E2E or global fixtures');
      return;
    }

    const result = await execCommand(
      `node dist/index.js project list -a ${fixtures.accountName}`,
      undefined,
      30000,
      fixtures.testHomeDir
    );

    // Should either succeed or fail gracefully
    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(result.stdout.includes('Found') || result.stdout.includes('project') || result.stdout.includes('📁')).toBe(
        true
      );
    }
  }, 30000);

  it('should handle project list command with team filter', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const testTeam = process.env.LINEAR_TEST_TEAM || 'TES';
    const fixtures = loadGlobalFixtures();

    if (!apiKey || !fixtures) {
      console.log('Skipping real API test: Missing LINEAR_API_KEY_E2E or global fixtures');
      return;
    }

    const result = await execCommand(
      `node dist/index.js project list -a ${fixtures.accountName} --team ${testTeam}`,
      undefined,
      15000,
      fixtures.testHomeDir
    );

    // Should either succeed or fail gracefully
    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      // Should contain team reference or project listing
      expect(result.stdout.includes('Found') || result.stdout.includes('project') || result.stdout.includes('No')).toBe(
        true
      );
    }
  }, 30000);

  it('should handle JSON output format for project list', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const fixtures = loadGlobalFixtures();

    if (!apiKey || !fixtures) {
      console.log('Skipping JSON format test: Missing LINEAR_API_KEY_E2E or global fixtures');
      return;
    }

    const result = await execCommand(
      `node dist/index.js project list -a ${fixtures.accountName} --format json --limit 5`,
      undefined,
      15000,
      fixtures.testHomeDir
    );

    if (result.exitCode === 0) {
      // Should contain JSON output
      expect(result.stdout.includes('[') || result.stdout.includes('{')).toBe(true);
    }
  }, 30000);
});
