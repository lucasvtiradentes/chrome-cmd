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
// CLI Command Options Types
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

export function validateCommandData(command: CliCommand, data: unknown): unknown {
  const schema = commandDataSchemaMap[command];
  if (!schema) {
    throw new Error(`Unknown command: ${command}`);
  }
  return schema.parse(data);
}

export type CommandRequest =
  | { command: CliCommand.TAB_LIST; data?: CommandDataMap[CliCommand.TAB_LIST] }
  | { command: CliCommand.TAB_EXEC; data: CommandDataMap[CliCommand.TAB_EXEC] }
  | { command: CliCommand.TAB_CLOSE; data: CommandDataMap[CliCommand.TAB_CLOSE] }
  | { command: CliCommand.TAB_FOCUS; data: CommandDataMap[CliCommand.TAB_FOCUS] }
  | { command: CliCommand.TAB_CREATE; data: CommandDataMap[CliCommand.TAB_CREATE] }
  | { command: CliCommand.TAB_REFRESH; data: CommandDataMap[CliCommand.TAB_REFRESH] }
  | { command: CliCommand.TAB_NAVIGATE; data: CommandDataMap[CliCommand.TAB_NAVIGATE] }
  | { command: CliCommand.TAB_SCREENSHOT; data: CommandDataMap[CliCommand.TAB_SCREENSHOT] }
  | { command: CliCommand.TAB_HTML; data?: CommandDataMap[CliCommand.TAB_HTML] }
  | { command: CliCommand.TAB_LOGS; data: CommandDataMap[CliCommand.TAB_LOGS] }
  | { command: CliCommand.CLEAR_TAB_LOGS; data: CommandDataMap[CliCommand.CLEAR_TAB_LOGS] }
  | { command: CliCommand.TAB_REQUESTS; data: CommandDataMap[CliCommand.TAB_REQUESTS] }
  | { command: CliCommand.CLEAR_TAB_REQUESTS; data: CommandDataMap[CliCommand.CLEAR_TAB_REQUESTS] }
  | { command: CliCommand.TAB_STORAGE; data: CommandDataMap[CliCommand.TAB_STORAGE] }
  | { command: CliCommand.TAB_CLICK; data: CommandDataMap[CliCommand.TAB_CLICK] }
  | { command: CliCommand.CLICK_ELEMENT_BY_TEXT; data: CommandDataMap[CliCommand.CLICK_ELEMENT_BY_TEXT] }
  | { command: CliCommand.TAB_INPUT; data: CommandDataMap[CliCommand.TAB_INPUT] }
  | { command: CliCommand.START_LOGGING; data: CommandDataMap[CliCommand.START_LOGGING] }
  | { command: CliCommand.STOP_LOGGING; data: CommandDataMap[CliCommand.STOP_LOGGING] }
  | { command: CliCommand.RELOAD_EXTENSION; data?: CommandDataMap[CliCommand.RELOAD_EXTENSION] }
  | { command: CliCommand.GET_PROFILE_INFO; data?: CommandDataMap[CliCommand.GET_PROFILE_INFO] }
  | { command: CliCommand.REGISTER; data: CommandDataMap[CliCommand.REGISTER] }
  | { command: CliCommand.PING; data?: CommandDataMap[CliCommand.PING] };

export const commandRequestSchema: z.ZodType<CommandRequest> = z.union([
  z.object({ command: z.literal(CliCommand.TAB_LIST), data: z.object({}).optional() }),
  z.object({ command: z.literal(CliCommand.TAB_EXEC), data: executeScriptDataSchema }),
  z.object({ command: z.literal(CliCommand.TAB_CLOSE), data: tabIdDataSchema }),
  z.object({ command: z.literal(CliCommand.TAB_FOCUS), data: tabIdDataSchema }),
  z.object({ command: z.literal(CliCommand.TAB_CREATE), data: createTabDataSchema }),
  z.object({ command: z.literal(CliCommand.TAB_REFRESH), data: tabIdDataSchema }),
  z.object({ command: z.literal(CliCommand.TAB_NAVIGATE), data: navigateTabDataSchema }),
  z.object({ command: z.literal(CliCommand.TAB_SCREENSHOT), data: captureScreenshotDataSchema }),
  z.object({ command: z.literal(CliCommand.TAB_HTML), data: z.object({}).optional() }),
  z.object({ command: z.literal(CliCommand.TAB_LOGS), data: tabIdDataSchema }),
  z.object({ command: z.literal(CliCommand.CLEAR_TAB_LOGS), data: tabIdDataSchema }),
  z.object({ command: z.literal(CliCommand.TAB_REQUESTS), data: getTabRequestsDataSchema }),
  z.object({ command: z.literal(CliCommand.CLEAR_TAB_REQUESTS), data: tabIdDataSchema }),
  z.object({ command: z.literal(CliCommand.TAB_STORAGE), data: tabIdDataSchema }),
  z.object({ command: z.literal(CliCommand.TAB_CLICK), data: clickElementDataSchema }),
  z.object({ command: z.literal(CliCommand.CLICK_ELEMENT_BY_TEXT), data: clickElementByTextDataSchema }),
  z.object({ command: z.literal(CliCommand.TAB_INPUT), data: fillInputDataSchema }),
  z.object({ command: z.literal(CliCommand.START_LOGGING), data: tabIdDataSchema }),
  z.object({ command: z.literal(CliCommand.STOP_LOGGING), data: tabIdDataSchema }),
  z.object({ command: z.literal(CliCommand.RELOAD_EXTENSION), data: z.object({}).optional() }),
  z.object({ command: z.literal(CliCommand.REGISTER), data: registerDataSchema }),
  z.object({ command: z.literal(CliCommand.GET_PROFILE_INFO), data: z.object({}).optional() }),
  z.object({ command: z.literal(CliCommand.PING), data: z.object({}).optional() })
]) as z.ZodType<CommandRequest>;

export type CommandRequestMap = {
  [CliCommand.TAB_LIST]: { command: CliCommand.TAB_LIST; data?: Record<string, never> };
  [CliCommand.TAB_EXEC]: { command: CliCommand.TAB_EXEC; data: ExecuteScriptData };
  [CliCommand.TAB_CLOSE]: { command: CliCommand.TAB_CLOSE; data: TabIdData };
  [CliCommand.TAB_FOCUS]: { command: CliCommand.TAB_FOCUS; data: TabIdData };
  [CliCommand.TAB_CREATE]: { command: CliCommand.TAB_CREATE; data: CreateTabData };
  [CliCommand.TAB_REFRESH]: { command: CliCommand.TAB_REFRESH; data: TabIdData };
  [CliCommand.TAB_NAVIGATE]: { command: CliCommand.TAB_NAVIGATE; data: NavigateTabData };
  [CliCommand.TAB_SCREENSHOT]: { command: CliCommand.TAB_SCREENSHOT; data: CaptureScreenshotData };
  [CliCommand.TAB_HTML]: { command: CliCommand.TAB_HTML; data?: Record<string, never> };
  [CliCommand.TAB_LOGS]: { command: CliCommand.TAB_LOGS; data: TabIdData };
  [CliCommand.CLEAR_TAB_LOGS]: { command: CliCommand.CLEAR_TAB_LOGS; data: TabIdData };
  [CliCommand.TAB_REQUESTS]: { command: CliCommand.TAB_REQUESTS; data: GetTabRequestsData };
  [CliCommand.CLEAR_TAB_REQUESTS]: { command: CliCommand.CLEAR_TAB_REQUESTS; data: TabIdData };
  [CliCommand.TAB_STORAGE]: { command: CliCommand.TAB_STORAGE; data: TabIdData };
  [CliCommand.TAB_CLICK]: { command: CliCommand.TAB_CLICK; data: ClickElementData };
  [CliCommand.CLICK_ELEMENT_BY_TEXT]: { command: CliCommand.CLICK_ELEMENT_BY_TEXT; data: ClickElementByTextData };
  [CliCommand.TAB_INPUT]: { command: CliCommand.TAB_INPUT; data: FillInputData };
  [CliCommand.START_LOGGING]: { command: CliCommand.START_LOGGING; data: TabIdData };
  [CliCommand.STOP_LOGGING]: { command: CliCommand.STOP_LOGGING; data: TabIdData };
  [CliCommand.RELOAD_EXTENSION]: { command: CliCommand.RELOAD_EXTENSION; data?: Record<string, never> };
  [CliCommand.REGISTER]: { command: CliCommand.REGISTER; data: RegisterData };
  [CliCommand.GET_PROFILE_INFO]: { command: CliCommand.GET_PROFILE_INFO; data?: Record<string, never> };
  [CliCommand.PING]: { command: CliCommand.PING; data?: Record<string, never> };
};

export type TypedCommandRequest<T extends CliCommand> = CommandRequestMap[T];

export type CommandDataType<T extends CliCommand> = CommandRequestMap[T]['data'];

export type ExtractCommandData<T> = T extends { command: CliCommand; data: infer D } ? D : never;

export type CommandDataMap = {
  [CliCommand.TAB_LIST]: undefined;
  [CliCommand.TAB_EXEC]: ExecuteScriptData;
  [CliCommand.TAB_CLOSE]: TabIdData;
  [CliCommand.TAB_FOCUS]: TabIdData;
  [CliCommand.TAB_CREATE]: CreateTabData;
  [CliCommand.TAB_REFRESH]: TabIdData;
  [CliCommand.TAB_NAVIGATE]: NavigateTabData;
  [CliCommand.TAB_SCREENSHOT]: CaptureScreenshotData;
  [CliCommand.TAB_HTML]: undefined;
  [CliCommand.TAB_LOGS]: TabIdData;
  [CliCommand.CLEAR_TAB_LOGS]: TabIdData;
  [CliCommand.TAB_REQUESTS]: GetTabRequestsData;
  [CliCommand.CLEAR_TAB_REQUESTS]: TabIdData;
  [CliCommand.TAB_STORAGE]: TabIdData;
  [CliCommand.TAB_CLICK]: ClickElementData;
  [CliCommand.CLICK_ELEMENT_BY_TEXT]: ClickElementByTextData;
  [CliCommand.TAB_INPUT]: FillInputData;
  [CliCommand.START_LOGGING]: TabIdData;
  [CliCommand.STOP_LOGGING]: TabIdData;
  [CliCommand.RELOAD_EXTENSION]: undefined;
  [CliCommand.GET_PROFILE_INFO]: undefined;
  [CliCommand.REGISTER]: RegisterData;
  [CliCommand.PING]: undefined;
};
