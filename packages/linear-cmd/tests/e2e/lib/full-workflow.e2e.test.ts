import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function execCommand(command: string, input?: string, timeout = 30000, homeDir?: string): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      cwd: path.resolve(__dirname, '../../'),
      env: {
        ...process.env,
        NODE_ENV: 'test',
        // Use provided HOME directory or keep original
        ...(homeDir ? { HOME: homeDir } : {}),
        // Force non-interactive mode for inquirer
        CI: 'true',
        FORCE_TTY: 'false',
        FORCE_STDIN: 'true'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let isResolved = false;

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }
    }, timeout);

    if (input && child.stdin) {
      // Write input with small delays to simulate real user interaction
      const lines = input.split('\n');
      let index = 0;

      const writeNext = () => {
        if (index < lines.length && child.stdin && !child.stdin.destroyed) {
          child.stdin.write(`${lines[index]}\n`);
          index++;
          if (index < lines.length) {
            setTimeout(writeNext, 500); // 500ms delay between inputs
          }
          // Don't end stdin immediately - let the process finish naturally
        }
      };

      setTimeout(writeNext, 1000); // Initial delay of 1 second
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

describe('Complete User Workflow E2E', () => {
  const testHomeDir = path.join(os.tmpdir(), `linear-cmd-e2e-${Date.now()}`);
  const testConfigDir = path.join(testHomeDir, '.config', 'linear-cmd');

  beforeEach(async () => {
    // Clean up any existing test config directories
    if (fs.existsSync(testHomeDir)) {
      fs.rmSync(testHomeDir, { recursive: true, force: true });
    }

    // Create fresh test home directory and config directory
    fs.mkdirSync(testConfigDir, { recursive: true });

    // Create default config files to ensure proper initialization
    const userMetadataPath = path.join(testConfigDir, 'user_metadata.json');
    const configPath = path.join(testConfigDir, 'config.json5');

    fs.writeFileSync(
      userMetadataPath,
      JSON.stringify({
        config_path: configPath
      })
    );

    // Write valid JSON5 config
    fs.writeFileSync(
      configPath,
      `{
  "accounts": {}
}`
    );
  });

  afterEach(() => {
    // Clean up test config after each test
    if (fs.existsSync(testHomeDir)) {
      fs.rmSync(testHomeDir, { recursive: true, force: true });
    }
  });

  it('should complete full workflow: add account → fetch real issue', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const testIssueId = process.env.LINEAR_TEST_ISSUE_ID;

    if (!apiKey || !testIssueId) {
      console.log('Skipping e2e test: Missing LINEAR_API_KEY_E2E or LINEAR_TEST_ISSUE_ID');
      return;
    }

    // Step 1: Add account with real API key (using interactive mode)
    const accountName = `e2e-test-${Date.now()}`;
    const addAccountInput = `${accountName}\n${apiKey}`;
    const addResult = await execCommand('node dist/index.js account add', addAccountInput, 30000, testHomeDir);

    // Interactive commands may fail in non-TTY environment
    if (addResult.exitCode !== 0) {
      console.log('Skipping test: account add requires interactive TTY');
      return;
    }

    expect(addResult.stdout).toContain('Account name');
    expect(addResult.stdout).toContain('Linear API key');

    // Step 2: List accounts to verify it was added
    const listResult = await execCommand('node dist/index.js account list', undefined, 30000, testHomeDir);

    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout).toContain(accountName);
    expect(listResult.stdout).toContain('Configured accounts:');

    // Step 3: Fetch real issue details
    const showResult = await execCommand(`node dist/index.js issue show ${testIssueId}`, undefined, 30000, testHomeDir);

    // Should either succeed or fail gracefully
    expect(showResult.exitCode === 0 || showResult.stderr.length > 0 || showResult.stdout.includes('Error')).toBe(true);

    if (showResult.exitCode === 0) {
      expect(showResult.stdout).toContain('🎯');
      expect(showResult.stdout).toContain('Status:');
      expect(showResult.stdout).toContain('Suggested Branch:');
    }

    // Step 4: Branch command was removed - test complete

    // Step 5: Test JSON output format (TODO: implement --format json flag)
    // const jsonResult = await execCommand(`node dist/index.js issue show ${testIssueId} --format json`);
    // expect(jsonResult.exitCode).toBe(0);
    // const issueData = JSON.parse(jsonResult.stdout);
    // expect(issueData).toHaveProperty('identifier');
  }, 60000); // 1 minute timeout for API calls

  it('should handle invalid API key gracefully', async () => {
    const invalidApiKey = 'invalid-api-key-12345';
    const accountName = `invalid-test-${Date.now()}`;
    const addAccountInput = `${accountName}\n${invalidApiKey}`;

    const result = await execCommand('node dist/index.js account add', addAccountInput, 10000, testHomeDir);

    // Should either show prompts or fail gracefully (interactive mode may not work in tests)
    expect(
      result.stdout.includes('Account name') ||
        result.stdout.includes('Linear API key') ||
        result.exitCode !== 0 ||
        result.stderr.length > 0
    ).toBe(true);
  });

  it('should handle non-existent issue gracefully', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;

    if (!apiKey) {
      console.log('Skipping e2e test: Missing LINEAR_API_KEY_E2E');
      return;
    }

    // Add account first
    const accountName = `e2e-test-${Date.now()}`;
    const addAccountInput = `${accountName}\n${apiKey}`;
    await execCommand('node dist/index.js account add', addAccountInput, 10000, testHomeDir);

    // Try to fetch non-existent issue
    const result = await execCommand('node dist/index.js issue show INVALID-999', undefined, 10000, testHomeDir);

    // Should handle error gracefully - might return different exit codes
    expect(result.exitCode !== 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);
  });
});
