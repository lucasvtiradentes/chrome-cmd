import { z } from 'zod';

// Linear API payload schemas
export const linearIssuePayloadSchema = z.object({
  teamId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.number().optional(),
  assigneeId: z.string().optional(),
  projectId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  stateId: z.string().optional(),
  estimate: z.number().optional(),
  dueDate: z.date().optional()
});

export const linearIssueUpdatePayloadSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.number().optional(),
  assigneeId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  teamId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  stateId: z.string().optional(),
  estimate: z.number().optional(),
  dueDate: z.date().optional()
});

export const linearIssueFilterSchema = z.object({
  assignee: z.object({ id: z.object({ eq: z.string() }) }).optional(),
  state: z.object({ id: z.object({ eq: z.string() }) }).optional(),
  labels: z.object({ some: z.object({ id: z.object({ eq: z.string() }) }) }).optional(),
  project: z.object({ id: z.object({ eq: z.string() }) }).optional(),
  team: z.object({ id: z.object({ eq: z.string() }) }).optional()
});

// Export types using z.infer
export type LinearIssuePayload = z.infer<typeof linearIssuePayloadSchema>;
export type LinearIssueUpdatePayload = z.infer<typeof linearIssueUpdatePayloadSchema>;
export type LinearIssueFilter = z.infer<typeof linearIssueFilterSchema>;
