import { CliCommand } from './cli-command';

export type CommandHandler<T extends CliCommand> = (data: CommandDataType<T>) => Promise<unknown>;

export type CommandHandlerMap = {
  [K in CliCommand]: CommandHandler<K>;
};

export type ExecuteScriptData = {
  tabId: number | string;
  code: string;
};

export type TabIdData = {
  tabId: number | string;
};

export type CreateTabData = {
  url?: string;
  active?: boolean;
};

export type NavigateTabData = {
  tabId: number | string;
  url: string;
};

export type CaptureScreenshotData = {
  tabId: number | string;
  format?: 'png' | 'jpeg';
  quality?: number;
  fullPage?: boolean;
};

export type ClickElementData = {
  tabId: number | string;
  selector: string;
};

export type ClickElementByTextData = {
  tabId: number | string;
  text: string;
};

export type FillInputData = {
  tabId: number | string;
  selector: string;
  value: string;
  submit?: boolean;
};

export type GetTabRequestsData = {
  tabId: number | string;
  includeBody?: boolean;
};

export type RegisterData = {
  extensionId: string;
  installationId: string;
  profileName: string;
};

export type CommandMessage = {
  command: CliCommand | string;
  data?: Record<string, unknown>;
  id: string;
};

export type ResponseMessage = {
  id: string;
  success: boolean;
  result?: unknown;
  error?: string;
};

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

export type NativeMessage = CommandMessage;
export type NativeResponse = ResponseMessage;

export type CommandDataMap = {
  [CliCommand.TAB_LIST]: Record<string, never>;
  [CliCommand.TAB_EXEC]: ExecuteScriptData;
  [CliCommand.TAB_CLOSE]: TabIdData;
  [CliCommand.TAB_FOCUS]: TabIdData;
  [CliCommand.TAB_CREATE]: CreateTabData;
  [CliCommand.TAB_REFRESH]: TabIdData;
  [CliCommand.TAB_NAVIGATE]: NavigateTabData;
  [CliCommand.TAB_SCREENSHOT]: CaptureScreenshotData;
  [CliCommand.TAB_HTML]: Record<string, never>;
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
  [CliCommand.RELOAD_EXTENSION]: Record<string, never>;
  [CliCommand.GET_PROFILE_INFO]: Record<string, never>;
  [CliCommand.REGISTER]: RegisterData;
  [CliCommand.PING]: Record<string, never>;
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
