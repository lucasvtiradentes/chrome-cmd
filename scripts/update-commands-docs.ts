#!/usr/bin/env tsx

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { COMMANDS_SCHEMA } from '../src/shared/commands/commands';
import { generateBashCompletion, generateZshCompletion } from '../src/shared/commands/generators/completion-generator';
import { generateHelp } from '../src/shared/commands/generators/help-generator';
import { generateReadmeSections } from '../src/shared/commands/generators/readme-generator';
import { FILES_CONFIG } from '../src/shared/configs/files.config.js';
import { PathHelper } from '../src/shared/utils/helpers/path.helper.js';

// ============================================================================
// VALIDATION
// ============================================================================

function validateSchema(): boolean {
  console.log('🔍 Validating commands schema...\n');

  let hasErrors = false;

  for (const cmd of COMMANDS_SCHEMA) {
    // Check command has name and description
    if (!cmd.name) {
      console.error(`❌ Command missing name`);
      hasErrors = true;
    }
    if (!cmd.description) {
      console.error(`❌ Command "${cmd.name}" missing description`);
      hasErrors = true;
    }

    // Check subcommands if present
    if (cmd.subcommands) {
      for (const sub of cmd.subcommands) {
        if (!sub.name) {
          console.error(`❌ Subcommand in "${cmd.name}" missing name`);
          hasErrors = true;
        }
        if (!sub.description) {
          console.error(`❌ Subcommand "${cmd.name} ${sub.name}" missing description`);
          hasErrors = true;
        }

        // Check flags if present
        if (sub.flags) {
          for (const flag of sub.flags) {
            if (!flag.name) {
              console.error(`❌ Flag in "${cmd.name} ${sub.name}" missing name`);
              hasErrors = true;
            }
            if (!flag.type) {
              console.error(`❌ Flag "${flag.name}" in "${cmd.name} ${sub.name}" missing type`);
              hasErrors = true;
            }
          }
        }
      }
    }

    // Check command-level flags if present
    if (cmd.flags) {
      for (const flag of cmd.flags) {
        if (!flag.name) {
          console.error(`❌ Flag in "${cmd.name}" missing name`);
          hasErrors = true;
        }
        if (!flag.type) {
          console.error(`❌ Flag "${flag.name}" in "${cmd.name}" missing type`);
          hasErrors = true;
        }
      }
    }
  }

  if (hasErrors) {
    console.error('\n❌ Schema validation failed\n');
    return false;
  }

  console.log('✅ Schema validation passed\n');
  return true;
}

// ============================================================================
// GENERATORS
// ============================================================================

function generateCompletionScripts(): void {
  console.log('📝 Generating shell completion scripts...\n');

  PathHelper.ensureDir(FILES_CONFIG.ZSH_COMPLETION_FILE);

  // Generate Zsh completion
  const zshScript = generateZshCompletion();
  writeFileSync(FILES_CONFIG.ZSH_COMPLETION_FILE, zshScript, 'utf-8');
  console.log(`  ✅ Zsh completion: completions/_chrome-cmd`);

  // Generate Bash completion
  const bashScript = generateBashCompletion();
  writeFileSync(FILES_CONFIG.BASH_COMPLETION_FILE, bashScript, 'utf-8');
  console.log(`  ✅ Bash completion: completions/chrome-cmd.bash`);

  console.log();
}

function generateHelpText(): void {
  console.log('📝 Generating help text...\n');

  PathHelper.ensureDir(FILES_CONFIG.HELP_FILE);

  // Generate help text (strip ANSI color codes for file)
  const helpText = generateHelp();
  const plainHelpText = helpText.replace(
    // biome-ignore lint/suspicious/noControlCharactersInRegex: needed for ANSI codes
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  );

  writeFileSync(FILES_CONFIG.HELP_FILE, plainHelpText, 'utf-8');
  console.log(`  ✅ Help text: docs/help.txt`);
  console.log();
}

function updateReadme(): void {
  console.log('📝 Updating README.md with generated content...\n');

  if (!existsSync(FILES_CONFIG.README_FILE)) {
    console.error('  ❌ README.md not found');
    return;
  }

  const readme = readFileSync(FILES_CONFIG.README_FILE, 'utf-8');
  const sections = generateReadmeSections();

  let updatedReadme = readme;

  // Update each section using markers
  const markers: Record<string, string> = {
    '<!-- BEGIN:TAB_MANAGEMENT -->': sections.tabManagement,
    '<!-- BEGIN:JAVASCRIPT -->': sections.javascript,
    '<!-- BEGIN:LOGS -->': sections.logs,
    '<!-- BEGIN:REQUESTS -->': sections.requests,
    '<!-- BEGIN:HTML -->': sections.html,
    '<!-- BEGIN:SCREENSHOTS -->': sections.screenshots,
    '<!-- BEGIN:STORAGE -->': sections.storage,
    '<!-- BEGIN:FORM_AUTOMATION -->': sections.formAutomation,
    '<!-- BEGIN:SYSTEM_COMMANDS -->': sections.systemCommands
  };

  let sectionsUpdated = 0;

  for (const [beginMarker, content] of Object.entries(markers)) {
    const endMarker = beginMarker.replace('BEGIN:', 'END:');
    const regex = new RegExp(`${escapeRegex(beginMarker)}[\\s\\S]*?${escapeRegex(endMarker)}`, 'g');

    if (regex.test(updatedReadme)) {
      updatedReadme = updatedReadme.replace(regex, `${beginMarker}\n${content}\n${endMarker}`);
      console.log(`  ✅ Updated: ${beginMarker.replace('<!-- BEGIN:', '').replace(' -->', '')}`);
      sectionsUpdated++;
    } else {
      console.log(`  ⚠️  Marker not found: ${beginMarker.replace('<!-- BEGIN:', '').replace(' -->', '')}`);
    }
  }

  writeFileSync(FILES_CONFIG.README_FILE, updatedReadme, 'utf-8');
  console.log(`\n  📄 ${sectionsUpdated}/${Object.keys(markers).length} sections updated in README.md`);
  console.log();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// SUMMARY
// ============================================================================

function printSummary(): void {
  console.log('═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));
  console.log();
  console.log('Generated files:');
  console.log('  • completions/_chrome-cmd       (Zsh completion)');
  console.log('  • completions/chrome-cmd.bash   (Bash completion)');
  console.log('  • docs/help.txt                 (Help reference)');
  console.log('  • README.md                     (Updated sections)');
  console.log();
  console.log('✨ All command documentation updated successfully!');
  console.log();
  console.log('Next steps:');
  console.log('  1. Review the changes in README.md');
  console.log('  2. Test completions: source completions/chrome-cmd.bash');
  console.log('  3. Commit the generated files if everything looks good');
  console.log();
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  console.log();
  console.log('═'.repeat(60));
  console.log('🔄 UPDATE COMMANDS DOCUMENTATION');
  console.log('═'.repeat(60));
  console.log();

  // Step 1: Validate schema
  if (!validateSchema()) {
    process.exit(1);
  }

  // Step 2: Generate completion scripts
  try {
    generateCompletionScripts();
  } catch (error) {
    console.error('❌ Failed to generate completion scripts:', error);
    process.exit(1);
  }

  // Step 3: Generate help text
  try {
    generateHelpText();
  } catch (error) {
    console.error('❌ Failed to generate help text:', error);
    process.exit(1);
  }

  // Step 4: Update README
  try {
    updateReadme();
  } catch (error) {
    console.error('❌ Failed to update README:', error);
    process.exit(1);
  }

  // Step 5: Print summary
  printSummary();
}

main();
