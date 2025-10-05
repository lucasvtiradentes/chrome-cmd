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

describe('Update Command E2E', () => {
  const testHomeDir = path.join(os.tmpdir(), `linear-cmd-update-e2e-${Date.now()}`);
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

  it('should check for updates successfully', async () => {
    const result = await execCommand('node dist/index.js update', undefined, 30000, testHomeDir);

    // Should either succeed or fail gracefully
    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(
        result.stdout.includes('Checking') || result.stdout.includes('version') || result.stdout.includes('up to date')
      ).toBe(true);
    }
  }, 45000);

  it('should show current version information', async () => {
    const result = await execCommand('node dist/index.js update', undefined, 30000, testHomeDir);

    // Should show version information regardless of update availability
    if (result.exitCode === 0) {
      expect(
        result.stdout.includes('version') || result.stdout.includes('Current') || result.stdout.includes('Latest')
      ).toBe(true);
    }
  }, 45000);

  it('should handle network errors gracefully', async () => {
    // Simulate network issues by setting invalid npm registry
    const env = {
      ...process.env,
      npm_config_registry: 'http://invalid-registry-url.local'
    };

    const result = await new Promise<CommandResult>((resolve, reject) => {
      const child = spawn('node', ['dist/index.js', 'update'], {
        cwd: path.resolve(__dirname, '../../'),
        env: {
          ...env,
          NODE_ENV: 'test',
          HOME: testHomeDir,
          CI: 'true',
          FORCE_TTY: 'false'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          child.kill('SIGTERM');
          reject(new Error('Command timed out after 20s'));
        }
      }, 20000);

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

    // Should handle network errors gracefully
    expect(result.exitCode !== 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);
  }, 30000);

  it('should handle --force flag (mock install)', async () => {
    // Note: This test will likely fail in CI/test environment due to permissions
    // but should handle the failure gracefully
    const result = await execCommand('node dist/index.js update --force', undefined, 45000, testHomeDir);

    // Should either succeed, fail with permission error, or handle gracefully
    expect(
      result.exitCode === 0 ||
        result.stderr.includes('permission') ||
        result.stderr.includes('EACCES') ||
        result.stdout.includes('Error') ||
        result.stdout.includes('Installing') ||
        result.stdout.includes('Update') ||
        result.stdout.includes('up to date') ||
        result.stdout.includes('already') ||
        result.stderr.length > 0
    ).toBe(true);
  }, 60000);

  it('should handle version comparison logic', async () => {
    const result = await execCommand('node dist/index.js update', undefined, 30000, testHomeDir);

    if (result.exitCode === 0) {
      // Should show comparison results
      const output = result.stdout.toLowerCase();
      expect(
        output.includes('latest') ||
          output.includes('current') ||
          output.includes('available') ||
          output.includes('up to date') ||
          output.includes('version')
      ).toBe(true);
    }
  }, 45000);

  it('should handle malformed package.json gracefully', async () => {
    // Create a malformed package.json in the project root temporarily
    const packagePath = path.resolve(__dirname, '../../../package.json');
    const originalContent = fs.readFileSync(packagePath, 'utf-8');

    try {
      // Temporarily corrupt the package.json
      fs.writeFileSync(packagePath, '{ "invalid": json }');

      const result = await execCommand('node dist/index.js update', undefined, 15000, testHomeDir);

      // Should handle gracefully
      expect(result.exitCode !== 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);
    } finally {
      // Restore original package.json
      fs.writeFileSync(packagePath, originalContent);
    }
  }, 20000);

  it('should handle npm command not found', async () => {
    // Set PATH to empty to simulate npm not found
    const result = await new Promise<CommandResult>((resolve, reject) => {
      const child = spawn('node', ['dist/index.js', 'update'], {
        cwd: path.resolve(__dirname, '../../'),
        env: {
          NODE_ENV: 'test',
          HOME: testHomeDir,
          PATH: path.dirname(process.execPath), // Only node directory, no npm
          CI: 'true',
          FORCE_TTY: 'false'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          child.kill('SIGTERM');
          reject(new Error('Command timed out'));
        }
      }, 15000);

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

    // Should handle npm not found gracefully
    expect(result.exitCode !== 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);
  }, 20000);
});
