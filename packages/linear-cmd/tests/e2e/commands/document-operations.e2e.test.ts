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
    // Parse command respecting quoted arguments
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    if (current) {
      parts.push(current);
    }

    const [cmd, ...args] = parts;
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

describe('Document Operations E2E', () => {
  const testHomeDir = path.join(os.tmpdir(), `linear-cmd-document-e2e-${Date.now()}`);
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
      `node dist/index.js project create -a ${accountName} --team ${team} --name "${projectName}" --description "E2E test project for document tests"`,
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

  async function deleteTestProject(homeDir: string, accountName: string, projectUrl: string): Promise<void> {
    await execCommand(
      `node dist/index.js project delete ${projectUrl} -a ${accountName} --yes`,
      undefined,
      30000,
      homeDir
    );
  }

  it('should handle document show command with real API if available', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const fixtures = loadGlobalFixtures();

    if (!apiKey || !fixtures) {
      console.log('Skipping real API test: Missing LINEAR_API_KEY_E2E or global fixtures');
      return;
    }

    const result = await execCommand(
      `node dist/index.js document show ${fixtures.documentUrl}`,
      undefined,
      15000,
      fixtures.testHomeDir
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout.includes('📄') || result.stdout.includes('Document') || result.stdout.length > 0).toBe(true);
  }, 90000);

  it('should handle non-existent document gracefully', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(
      'node dist/index.js document show NONEXISTENT-999',
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

  it('should handle JSON output format for document show', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const fixtures = loadGlobalFixtures();

    if (!apiKey || !fixtures) {
      console.log('Skipping JSON format test: Missing LINEAR_API_KEY_E2E or global fixtures');
      return;
    }

    const result = await execCommand(
      `node dist/index.js document show ${fixtures.documentUrl} --format json`,
      undefined,
      15000,
      fixtures.testHomeDir
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout.includes('{') && (result.stdout.includes('"title"') || result.stdout.includes('"id"'))).toBe(
      true
    );
  }, 90000);

  it('should validate required arguments for document commands', async () => {
    await setupTestAccount(testHomeDir);

    // Test missing arguments
    const showResult = await execCommand('node dist/index.js document show', undefined, 10000, testHomeDir);
    expect(showResult.exitCode !== 0 || showResult.stderr.length > 0).toBe(true);
  }, 20000);

  it('should handle document commands without account configured', async () => {
    // Don't set up any account

    const showResult = await execCommand('node dist/index.js document show TEST-123', undefined, 10000, testHomeDir);

    // Should handle gracefully - no accounts error
    expect(showResult.exitCode !== 0 || showResult.stderr.length > 0 || showResult.stdout.includes('No accounts')).toBe(
      true
    );
  }, 20000);

  it('should create document in project, then delete both without leaving garbage', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const testTeam = process.env.LINEAR_TEST_TEAM || 'TES';
    const fixtures = loadGlobalFixtures();

    if (!apiKey || !fixtures) {
      console.log('Skipping real API test: Missing LINEAR_API_KEY_E2E or global fixtures');
      return;
    }

    // Use global account instead of creating a new one
    const accountName = fixtures.accountName;

    // Step 1: Create a test project
    const projectUrl = await createTestProject(fixtures.testHomeDir, accountName, testTeam);

    if (!projectUrl) {
      console.log('Failed to create test project, skipping test');
      return;
    }

    let documentUrl: string | null = null;

    try {
      // Step 2: Create a document linked to the project
      const documentTitle = `E2E Test Document ${Date.now()}`;
      const addResult = await execCommand(
        `node dist/index.js document add -a ${accountName} --title "${documentTitle}" --content "This is a test document created by e2e tests" --project ${projectUrl}`,
        undefined,
        20000,
        fixtures.testHomeDir
      );

      expect(addResult.exitCode).toBe(0);
      expect(addResult.stdout.includes('Document created successfully')).toBe(true);

      // Extract document URL from output
      const docUrlMatch = addResult.stdout.match(/https:\/\/linear\.app\/[^\s]+/);
      documentUrl = docUrlMatch ? docUrlMatch[0] : null;

      if (documentUrl) {
        // Step 3: Verify document was created by showing it
        const showResult = await execCommand(
          `node dist/index.js document show ${documentUrl}`,
          undefined,
          20000,
          fixtures.testHomeDir
        );

        expect(showResult.exitCode).toBe(0);
        expect(showResult.stdout.includes(documentTitle) || showResult.stdout.includes('📄')).toBe(true);

        // Step 4: Delete the document
        const deleteDocResult = await execCommand(
          `node dist/index.js document delete ${documentUrl} --yes`,
          undefined,
          20000,
          fixtures.testHomeDir
        );

        expect(deleteDocResult.exitCode).toBe(0);
        expect(deleteDocResult.stdout.includes('deleted successfully')).toBe(true);
      }
    } finally {
      // Step 5: Cleanup - delete the test project
      await deleteTestProject(fixtures.testHomeDir, accountName, projectUrl);
    }
  }, 60000);
});
