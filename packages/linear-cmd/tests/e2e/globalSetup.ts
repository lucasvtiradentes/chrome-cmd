import './load-env';

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { clearGlobalFixtures, loadGlobalFixtures, saveGlobalFixtures } from './global-fixtures';

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

export async function setup() {
  // Check if we should create global fixtures
  const apiKey = process.env.LINEAR_API_KEY_E2E;
  const testTeam = process.env.LINEAR_TEST_TEAM || 'TES';

  if (!apiKey) {
    console.log('⚠️  Skipping global fixtures creation: Missing LINEAR_API_KEY_E2E\n');
    return;
  }

  console.log('🌍 Creating global fixtures for all E2E tests...');

  const testHomeDir = path.join(os.tmpdir(), `linear-cmd-global-e2e-${Date.now()}`);
  const testConfigDir = path.join(testHomeDir, '.config', 'linear-cmd');

  try {
    // Setup test home directory
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

    // Setup test account
    const accountName = `e2e-global-${Date.now()}`;
    const addInput = `${accountName}\n${apiKey}`;
    await execCommand('node dist/index.js account add', addInput, 15000, testHomeDir);

    console.log('  ✓ Created test account');

    // Create test project
    const projectName = `E2E-Global-Project-${Date.now()}`;
    const projectResult = await execCommand(
      `node dist/index.js project create -a ${accountName} --team ${testTeam} --name "${projectName}" --description "Global E2E test project - DO NOT DELETE MANUALLY"`,
      undefined,
      30000,
      testHomeDir
    );

    const projectUrlMatch = projectResult.stdout.match(/https:\/\/linear\.app\/[^\s]+/);
    const projectUrl = projectUrlMatch ? projectUrlMatch[0] : null;

    if (!projectUrl) {
      console.error('Project creation failed:');
      console.error('Exit code:', projectResult.exitCode);
      console.error('Stdout:', projectResult.stdout);
      console.error('Stderr:', projectResult.stderr);
      throw new Error('Failed to create test project');
    }

    console.log('  ✓ Created test project');

    // Create test document
    const documentTitle = `E2E Global Document ${Date.now()}`;
    const documentResult = await execCommand(
      `node dist/index.js document add -a ${accountName} --title "${documentTitle}" --content "Global test document - DO NOT DELETE MANUALLY" --project ${projectUrl}`,
      undefined,
      30000,
      testHomeDir
    );

    const documentUrlMatch = documentResult.stdout.match(/https:\/\/linear\.app\/[^\s]+/);
    const documentUrl = documentUrlMatch ? documentUrlMatch[0] : null;

    if (!documentUrl) {
      throw new Error('Failed to create test document');
    }

    console.log('  ✓ Created test document');

    // Create test issue
    const issueResult = await execCommand(
      `node dist/index.js issue create -a ${accountName} --team ${testTeam} --title "E2E Global Issue ${Date.now()}" --description "Global test issue - DO NOT DELETE MANUALLY" --project ${projectUrl}`,
      undefined,
      30000,
      testHomeDir
    );

    // Match only the issue URL (not project URL)
    const issueUrlMatch = issueResult.stdout.match(/https:\/\/linear\.app\/[^/]+\/issue\/[^\s'"]+/);
    const issueUrl = issueUrlMatch ? issueUrlMatch[0] : null;

    if (!issueUrl) {
      throw new Error('Failed to create test issue');
    }

    console.log('  ✓ Created test issue');

    // Save fixtures
    saveGlobalFixtures({
      projectUrl,
      documentUrl,
      issueUrl,
      accountName,
      testHomeDir
    });

    console.log('✅ Global fixtures created successfully\n');
  } catch (error) {
    console.error('❌ Failed to create global fixtures:', error);
    // Clean up partial setup
    if (fs.existsSync(testHomeDir)) {
      fs.rmSync(testHomeDir, { recursive: true, force: true });
    }
    clearGlobalFixtures();
    console.log('⚠️  Tests will run without global fixtures (slower)\n');
  }
}

export async function teardown() {
  console.log('\n🧹 Cleaning up global fixtures...');

  const apiKey = process.env.LINEAR_API_KEY_E2E;

  if (!apiKey) {
    console.log('⚠️  Skipping cleanup: Missing LINEAR_API_KEY_E2E');
    return;
  }

  try {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('⚠️  No global fixtures to clean up');
      return;
    }

    const { projectUrl, documentUrl, issueUrl, accountName, testHomeDir } = fixtures;

    // Delete document
    if (documentUrl) {
      await execCommand(`node dist/index.js document delete ${documentUrl} --yes`, undefined, 30000, testHomeDir);
      console.log('  ✓ Deleted test document');
    }

    // Archive issue (Linear doesn't support delete, only archive)
    if (issueUrl) {
      console.log(`  Archiving issue: ${issueUrl}`);
      const archiveResult = await execCommand(
        `node dist/index.js issue update ${issueUrl} --archive`,
        undefined,
        30000,
        testHomeDir
      );
      if (archiveResult.exitCode === 0) {
        console.log('  ✓ Archived test issue successfully');
      } else {
        console.error('  ✗ Failed to archive issue');
        console.error('    Stdout:', archiveResult.stdout);
        console.error('    Stderr:', archiveResult.stderr);
      }
    }

    // Delete project
    if (projectUrl) {
      await execCommand(
        `node dist/index.js project delete ${projectUrl} -a ${accountName} --yes`,
        undefined,
        30000,
        testHomeDir
      );
      console.log('  ✓ Deleted test project');
    }

    // Clean up test home directory
    if (fs.existsSync(testHomeDir)) {
      fs.rmSync(testHomeDir, { recursive: true, force: true });
      console.log('  ✓ Cleaned up test directory');
    }

    // Clear fixtures file
    clearGlobalFixtures();

    console.log('✅ Global fixtures cleaned up successfully\n');
  } catch (error) {
    console.error('❌ Failed to clean up global fixtures:', error);
    console.error('You may need to manually delete test resources in Linear');
  }

  console.log('🧹 E2E tests completed\n');
}
