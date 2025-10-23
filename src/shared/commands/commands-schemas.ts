import { z } from 'zod';
import { CliCommand } from './cli-command';

export type CommandHandler<T extends CliCommand> = (data: CommandDataType<T>) => Promise<unknown>;

export type CommandHandlerMap = {
  [K in CliCommand]: CommandHandler<K>;
};

export const executeScriptDataSchema = z.object({
  tabId: z.union([z.number(), z.string()]),
  code: z.string()
});

export const tabIdDataSchema = z.object({
  tabId: z.union([z.number(), z.string()])
});

export const createTabDataSchema = z.object({
  url: z.string().optional(),
  active: z.boolean().optional().default(true)
});

export const navigateTabDataSchema = z.object({
  tabId: z.union([z.number(), z.string()]),
  url: z.string()
});

export const captureScreenshotDataSchema = z.object({
  tabId: z.union([z.number(), z.string()]),
  format: z.enum(['png', 'jpeg']).optional().default('png'),
  quality: z.number().min(0).max(100).optional().default(90),
  fullPage: z.boolean().optional().default(true)
});

export const clickElementDataSchema = z.object({
  tabId: z.union([z.number(), z.string()]),
  selector: z.string()
});

export const clickElementByTextDataSchema = z.object({
  tabId: z.union([z.number(), z.string()]),
  text: z.string()
});

export const fillInputDataSchema = z.object({
  tabId: z.union([z.number(), z.string()]),
  selector: z.string(),
  value: z.string(),
  submit: z.boolean().optional().default(false)
});

export const getTabRequestsDataSchema = z.object({
  tabId: z.union([z.number(), z.string()]),
  includeBody: z.boolean().optional().default(false)
});

export const registerDataSchema = z.object({
  extensionId: z.string(),
  installationId: z.string(),
  profileName: z.string()
});

export const commandMessageSchema = z.object({
  command: z.union([z.nativeEnum(CliCommand), z.nativeEnum(CliCommand), z.string()]),
  data: z.record(z.unknown()).optional(),
  id: z.string()
});

export const responseMessageSchema = z.object({
  id: z.string(),
  success: z.boolean(),
  result: z.unknown().optional(),
  error: z.string().optional()
});

export type ExecuteScriptData = z.infer<typeof executeScriptDataSchema>;
export type TabIdData = z.infer<typeof tabIdDataSchema>;
export type CreateTabData = z.infer<typeof createTabDataSchema>;
export type NavigateTabData = z.infer<typeof navigateTabDataSchema>;
export type CaptureScreenshotData = z.infer<typeof captureScreenshotDataSchema>;
export type ClickElementData = z.infer<typeof clickElementDataSchema>;
export type ClickElementByTextData = z.infer<typeof clickElementByTextDataSchema>;
export type FillInputData = z.infer<typeof fillInputDataSchema>;
export type GetTabRequestsData = z.infer<typeof getTabRequestsDataSchema>;
export type RegisterData = z.infer<typeof registerDataSchema>;

// ============================================================================
// CLI Command Options Types (derived from schemas)
// ============================================================================

export type SubCommandOptions<_CommandName extends string, _SubCommandName extends string> = Record<
  string,
  string | number | boolean | undefined
>;

export type TabsListOptions = Record<string, never>;
export type TabsSelectOptions = { tab?: number };
export type TabsFocusOptions = { tab?: number };
export type TabsCreateOptions = { background?: boolean };
export type TabsNavigateOptions = { tab?: number };
export type TabsExecOptions = { tab?: number };
export type TabsCloseOptions = { tab?: number };
export type TabsRefreshOptions = { tab?: number };
export type TabsScreenshotOptions = { tab?: number; output?: string; onlyViewport?: boolean };
export type TabsHtmlOptions = { tab?: number; selector?: string; raw?: boolean; includeCompactedTags?: boolean };
export type TabsLogsOptions = {
  tab?: number;
  n?: number;
  error?: boolean;
  warn?: boolean;
  info?: boolean;
  log?: boolean;
  debug?: boolean;
};
export type TabsRequestsOptions = {
  tab?: number;
  n?: number;
  method?: string;
  status?: number;
  url?: string;
  failed?: boolean;
  all?: boolean;
  body?: boolean;
  headers?: boolean;
};
export type TabsStorageOptions = { tab?: number; cookies?: boolean; local?: boolean; session?: boolean };
export type TabsClickOptions = { tab?: number; selector?: string; text?: string };
export type TabsInputOptions = { tab?: number; selector?: string; value?: string; submit?: boolean };

export type CommandMessage = z.infer<typeof commandMessageSchema>;
export type ResponseMessage = z.infer<typeof responseMessageSchema>;

export type NativeMessage = CommandMessage;
export type NativeResponse = ResponseMessage;

export const commandDataSchemaMap = {
  [CliCommand.TAB_LIST]: z.object({}).optional(),
  [CliCommand.TAB_EXEC]: executeScriptDataSchema,
  [CliCommand.TAB_CLOSE]: tabIdDataSchema,
  [CliCommand.TAB_FOCUS]: tabIdDataSchema,
  [CliCommand.TAB_CREATE]: createTabDataSchema,
  [CliCommand.TAB_REFRESH]: tabIdDataSchema,
  [CliCommand.TAB_NAVIGATE]: navigateTabDataSchema,
  [CliCommand.TAB_SCREENSHOT]: captureScreenshotDataSchema,
  [CliCommand.TAB_HTML]: z.object({}).optional(),
  [CliCommand.TAB_LOGS]: tabIdDataSchema,
  [CliCommand.CLEAR_TAB_LOGS]: tabIdDataSchema,
  [CliCommand.TAB_REQUESTS]: getTabRequestsDataSchema,
  [CliCommand.CLEAR_TAB_REQUESTS]: tabIdDataSchema,
  [CliCommand.TAB_STORAGE]: tabIdDataSchema,
  [CliCommand.TAB_CLICK]: clickElementDataSchema,
  [CliCommand.CLICK_ELEMENT_BY_TEXT]: clickElementByTextDataSchema,
  [CliCommand.TAB_INPUT]: fillInputDataSchema,
  [CliCommand.START_LOGGING]: tabIdDataSchema,
  [CliCommand.STOP_LOGGING]: tabIdDataSchema,
  [CliCommand.RELOAD_EXTENSION]: z.object({}).optional(),
  [CliCommand.REGISTER]: registerDataSchema,
  [CliCommand.GET_PROFILE_INFO]: z.object({}).optional(),
  [CliCommand.PING]: z.object({}).optional()
} as const;

export type CommandDataMap = {
  [K in CliCommand]: z.infer<(typeof commandDataSchemaMap)[K]>;
};

export type CommandRequestMap = {
  [K in CliCommand]: {
    command: K;
    data: CommandDataMap[K];
  };
};

export type CommandRequest = CommandRequestMap[CliCommand];

export type TypedCommandRequest<T extends CliCommand> = CommandRequestMap[T];

export type CommandDataType<T extends CliCommand> = CommandDataMap[T];

export type ExtractCommandData<T> = T extends { command: CliCommand; data: infer D } ? D : never;
