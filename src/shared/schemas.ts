import { z } from 'zod';
import { ChromeCommand } from './commands.js';

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

export const commandMessageSchema = z.object({
  command: z.union([z.nativeEnum(ChromeCommand), z.string()]),
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

export type CommandMessage = z.infer<typeof commandMessageSchema>;
export type ResponseMessage = z.infer<typeof responseMessageSchema>;

export type NativeMessage = CommandMessage;
export type NativeResponse = ResponseMessage;

export const commandDataSchemaMap = {
  [ChromeCommand.LIST_TABS]: z.object({}).optional(),
  [ChromeCommand.EXECUTE_SCRIPT]: executeScriptDataSchema,
  [ChromeCommand.CLOSE_TAB]: tabIdDataSchema,
  [ChromeCommand.ACTIVATE_TAB]: tabIdDataSchema,
  [ChromeCommand.CREATE_TAB]: createTabDataSchema,
  [ChromeCommand.RELOAD_TAB]: tabIdDataSchema,
  [ChromeCommand.NAVIGATE_TAB]: navigateTabDataSchema,
  [ChromeCommand.CAPTURE_SCREENSHOT]: captureScreenshotDataSchema,
  [ChromeCommand.GET_TAB_LOGS]: tabIdDataSchema,
  [ChromeCommand.CLEAR_TAB_LOGS]: tabIdDataSchema,
  [ChromeCommand.GET_TAB_REQUESTS]: getTabRequestsDataSchema,
  [ChromeCommand.CLEAR_TAB_REQUESTS]: tabIdDataSchema,
  [ChromeCommand.START_LOGGING]: tabIdDataSchema,
  [ChromeCommand.STOP_LOGGING]: tabIdDataSchema,
  [ChromeCommand.GET_STORAGE]: tabIdDataSchema,
  [ChromeCommand.CLICK_ELEMENT]: clickElementDataSchema,
  [ChromeCommand.CLICK_ELEMENT_BY_TEXT]: clickElementByTextDataSchema,
  [ChromeCommand.FILL_INPUT]: fillInputDataSchema,
  [ChromeCommand.RELOAD_EXTENSION]: z.object({}).optional(),
  [ChromeCommand.PING]: z.object({}).optional()
} as const;

export function validateCommandData(command: ChromeCommand, data: unknown): unknown {
  const schema = commandDataSchemaMap[command];
  if (!schema) {
    throw new Error(`Unknown command: ${command}`);
  }
  return schema.parse(data);
}

export const commandRequestSchema = z.discriminatedUnion('command', [
  z.object({ command: z.literal(ChromeCommand.LIST_TABS), data: z.object({}).optional() }),
  z.object({ command: z.literal(ChromeCommand.EXECUTE_SCRIPT), data: executeScriptDataSchema }),
  z.object({ command: z.literal(ChromeCommand.CLOSE_TAB), data: tabIdDataSchema }),
  z.object({ command: z.literal(ChromeCommand.ACTIVATE_TAB), data: tabIdDataSchema }),
  z.object({ command: z.literal(ChromeCommand.CREATE_TAB), data: createTabDataSchema }),
  z.object({ command: z.literal(ChromeCommand.RELOAD_TAB), data: tabIdDataSchema }),
  z.object({ command: z.literal(ChromeCommand.NAVIGATE_TAB), data: navigateTabDataSchema }),
  z.object({ command: z.literal(ChromeCommand.CAPTURE_SCREENSHOT), data: captureScreenshotDataSchema }),
  z.object({ command: z.literal(ChromeCommand.GET_TAB_LOGS), data: tabIdDataSchema }),
  z.object({ command: z.literal(ChromeCommand.CLEAR_TAB_LOGS), data: tabIdDataSchema }),
  z.object({ command: z.literal(ChromeCommand.GET_TAB_REQUESTS), data: getTabRequestsDataSchema }),
  z.object({ command: z.literal(ChromeCommand.CLEAR_TAB_REQUESTS), data: tabIdDataSchema }),
  z.object({ command: z.literal(ChromeCommand.START_LOGGING), data: tabIdDataSchema }),
  z.object({ command: z.literal(ChromeCommand.STOP_LOGGING), data: tabIdDataSchema }),
  z.object({ command: z.literal(ChromeCommand.GET_STORAGE), data: tabIdDataSchema }),
  z.object({ command: z.literal(ChromeCommand.CLICK_ELEMENT), data: clickElementDataSchema }),
  z.object({ command: z.literal(ChromeCommand.CLICK_ELEMENT_BY_TEXT), data: clickElementByTextDataSchema }),
  z.object({ command: z.literal(ChromeCommand.FILL_INPUT), data: fillInputDataSchema }),
  z.object({ command: z.literal(ChromeCommand.RELOAD_EXTENSION), data: z.object({}).optional() }),
  z.object({ command: z.literal(ChromeCommand.PING), data: z.object({}).optional() })
]);

export type CommandRequest = z.infer<typeof commandRequestSchema>;

export type CommandRequestMap = {
  [ChromeCommand.LIST_TABS]: { command: ChromeCommand.LIST_TABS; data?: Record<string, never> };
  [ChromeCommand.EXECUTE_SCRIPT]: { command: ChromeCommand.EXECUTE_SCRIPT; data: ExecuteScriptData };
  [ChromeCommand.CLOSE_TAB]: { command: ChromeCommand.CLOSE_TAB; data: TabIdData };
  [ChromeCommand.ACTIVATE_TAB]: { command: ChromeCommand.ACTIVATE_TAB; data: TabIdData };
  [ChromeCommand.CREATE_TAB]: { command: ChromeCommand.CREATE_TAB; data: CreateTabData };
  [ChromeCommand.RELOAD_TAB]: { command: ChromeCommand.RELOAD_TAB; data: TabIdData };
  [ChromeCommand.NAVIGATE_TAB]: { command: ChromeCommand.NAVIGATE_TAB; data: NavigateTabData };
  [ChromeCommand.CAPTURE_SCREENSHOT]: { command: ChromeCommand.CAPTURE_SCREENSHOT; data: CaptureScreenshotData };
  [ChromeCommand.GET_TAB_LOGS]: { command: ChromeCommand.GET_TAB_LOGS; data: TabIdData };
  [ChromeCommand.CLEAR_TAB_LOGS]: { command: ChromeCommand.CLEAR_TAB_LOGS; data: TabIdData };
  [ChromeCommand.GET_TAB_REQUESTS]: { command: ChromeCommand.GET_TAB_REQUESTS; data: GetTabRequestsData };
  [ChromeCommand.CLEAR_TAB_REQUESTS]: { command: ChromeCommand.CLEAR_TAB_REQUESTS; data: TabIdData };
  [ChromeCommand.START_LOGGING]: { command: ChromeCommand.START_LOGGING; data: TabIdData };
  [ChromeCommand.STOP_LOGGING]: { command: ChromeCommand.STOP_LOGGING; data: TabIdData };
  [ChromeCommand.GET_STORAGE]: { command: ChromeCommand.GET_STORAGE; data: TabIdData };
  [ChromeCommand.CLICK_ELEMENT]: { command: ChromeCommand.CLICK_ELEMENT; data: ClickElementData };
  [ChromeCommand.CLICK_ELEMENT_BY_TEXT]: { command: ChromeCommand.CLICK_ELEMENT_BY_TEXT; data: ClickElementByTextData };
  [ChromeCommand.FILL_INPUT]: { command: ChromeCommand.FILL_INPUT; data: FillInputData };
  [ChromeCommand.RELOAD_EXTENSION]: { command: ChromeCommand.RELOAD_EXTENSION; data?: Record<string, never> };
  [ChromeCommand.PING]: { command: ChromeCommand.PING; data?: Record<string, never> };
};

export type TypedCommandRequest<T extends ChromeCommand> = CommandRequestMap[T];

export type CommandDataType<T extends ChromeCommand> = CommandRequestMap[T]['data'];

export type ExtractCommandData<T> = T extends { command: ChromeCommand; data: infer D } ? D : never;

export type CommandDataMap = {
  [ChromeCommand.LIST_TABS]: undefined;
  [ChromeCommand.EXECUTE_SCRIPT]: ExecuteScriptData;
  [ChromeCommand.CLOSE_TAB]: TabIdData;
  [ChromeCommand.ACTIVATE_TAB]: TabIdData;
  [ChromeCommand.CREATE_TAB]: CreateTabData;
  [ChromeCommand.RELOAD_TAB]: TabIdData;
  [ChromeCommand.NAVIGATE_TAB]: NavigateTabData;
  [ChromeCommand.CAPTURE_SCREENSHOT]: CaptureScreenshotData;
  [ChromeCommand.GET_TAB_LOGS]: TabIdData;
  [ChromeCommand.CLEAR_TAB_LOGS]: TabIdData;
  [ChromeCommand.GET_TAB_REQUESTS]: GetTabRequestsData;
  [ChromeCommand.CLEAR_TAB_REQUESTS]: TabIdData;
  [ChromeCommand.START_LOGGING]: TabIdData;
  [ChromeCommand.STOP_LOGGING]: TabIdData;
  [ChromeCommand.GET_STORAGE]: TabIdData;
  [ChromeCommand.CLICK_ELEMENT]: ClickElementData;
  [ChromeCommand.CLICK_ELEMENT_BY_TEXT]: ClickElementByTextData;
  [ChromeCommand.FILL_INPUT]: FillInputData;
  [ChromeCommand.RELOAD_EXTENSION]: undefined;
  [ChromeCommand.PING]: undefined;
};
