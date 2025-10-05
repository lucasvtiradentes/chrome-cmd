import { z } from 'zod';

// Local application schemas (non-Linear API related)

// User metadata file structure
export const userMetadataSchema = z.object({
  config_path: z.string(),
  active_account: z.string().optional()
});

// Account schema
export const accountSchema = z.object({
  name: z.string(),
  api_key: z.string(),
  team_id: z.string().optional(),
  workspaces: z.array(z.string()).optional()
});

// Linear CLI configuration schema
export const linearConfigSchema = z.object({
  $schema: z.string().optional(),
  accounts: z.record(z.string(), accountSchema),
  settings: z
    .object({
      completion_installed: z.boolean().optional()
    })
    .optional()
});

// Issue data structure (for local processing/display)
export const issueDataSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  title: z.string(),
  description: z.string().optional(),
  state: z.object({
    name: z.string(),
    color: z.string()
  }),
  assignee: z
    .object({
      name: z.string(),
      email: z.string()
    })
    .optional(),
  labels: z.array(
    z.object({
      name: z.string(),
      color: z.string()
    })
  ),
  comments: z.array(
    z.object({
      id: z.string(),
      body: z.string(),
      user: z.object({
        name: z.string(),
        email: z.string()
      }),
      createdAt: z.date()
    })
  ),
  pullRequests: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      title: z.string(),
      number: z.number(),
      draft: z.boolean(),
      merged: z.boolean()
    })
  ),
  createdAt: z.date(),
  updatedAt: z.date(),
  url: z.string()
});

// Project data structure (for local processing/display)
export const projectDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  state: z.string(),
  startDate: z.date().optional(),
  targetDate: z.date().optional(),
  lead: z
    .object({
      name: z.string(),
      email: z.string()
    })
    .optional(),
  progress: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  url: z.string()
});

// Project issue data structure (for listing issues in a project)
export const projectIssueDataSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  title: z.string(),
  state: z.object({
    name: z.string(),
    color: z.string()
  }),
  assignee: z
    .object({
      name: z.string(),
      email: z.string()
    })
    .optional(),
  dueDate: z.date().optional(),
  project: z
    .object({
      name: z.string(),
      milestone: z.string().optional()
    })
    .optional(),
  priority: z.number().optional(),
  labels: z.array(
    z.object({
      name: z.string(),
      color: z.string()
    })
  ),
  pullRequests: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      title: z.string(),
      number: z.number(),
      draft: z.boolean(),
      merged: z.boolean()
    })
  ),
  subIssues: z.array(
    z.object({
      identifier: z.string(),
      title: z.string(),
      completed: z.boolean()
    })
  ),
  url: z.string()
});

// Document data structure (for local processing/display)
export const documentDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().optional(),
  createdBy: z
    .object({
      name: z.string(),
      email: z.string()
    })
    .optional(),
  updatedBy: z
    .object({
      name: z.string(),
      email: z.string()
    })
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  url: z.string()
});

// Export types using z.infer
export type UserMetadata = z.infer<typeof userMetadataSchema>;
export type Account = z.infer<typeof accountSchema>;
export type LinearConfig = z.infer<typeof linearConfigSchema>;
export type IssueData = z.infer<typeof issueDataSchema>;
export type ProjectData = z.infer<typeof projectDataSchema>;
export type ProjectIssueData = z.infer<typeof projectIssueDataSchema>;
export type DocumentData = z.infer<typeof documentDataSchema>;
