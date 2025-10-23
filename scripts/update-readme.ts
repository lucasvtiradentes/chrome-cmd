#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateReadmeSections } from '../src/shared/commands/generators/readme-generator';

const README_PATH = join(process.cwd(), 'README.md');

function updateReadme() {
  console.log('📝 Updating README.md with generated content...');

  const readme = readFileSync(README_PATH, 'utf-8');
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

  for (const [beginMarker, content] of Object.entries(markers)) {
    const endMarker = beginMarker.replace('BEGIN:', 'END:');
    const regex = new RegExp(`${escapeRegex(beginMarker)}[\\s\\S]*?${escapeRegex(endMarker)}`, 'g');

    if (regex.test(updatedReadme)) {
      updatedReadme = updatedReadme.replace(regex, `${beginMarker}\n${content}\n${endMarker}`);
      console.log(`✅ Updated section: ${beginMarker}`);
    } else {
      console.log(`⚠️  Marker not found: ${beginMarker}`);
    }
  }

  writeFileSync(README_PATH, updatedReadme, 'utf-8');
  console.log('\n✨ README.md updated successfully!');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

updateReadme();
