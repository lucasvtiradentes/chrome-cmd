import { Command } from 'commander';

import { createCreateProjectCommand } from './create-project.js';
import { createDeleteProjectCommand } from './delete-project.js';
import { createListProjectIssuesCommand } from './list-project-issues.js';
import { createListProjectsCommand } from './list-projects.js';
import { createShowProjectCommand } from './show-project.js';

export function createProjectCommand(): Command {
  const project = new Command('project');
  project.description('Manage Linear projects');

  project.addCommand(createListProjectsCommand());
  project.addCommand(createShowProjectCommand());
  project.addCommand(createListProjectIssuesCommand());
  project.addCommand(createCreateProjectCommand());
  project.addCommand(createDeleteProjectCommand());

  return project;
}
