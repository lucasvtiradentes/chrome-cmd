import type { EmptyObject } from '../utils/types';
import { ProtocolCommand } from './cli-command';
import type {
  CaptureScreenshotData,
  ClickElementByTextData,
  ClickElementData,
  CreateTabData,
  ExecuteScriptData,
  FillInputData,
  GetTabRequestsData,
  NavigateTabData,
  TabIdData,
  TabsClickOptions,
  TabsCloseOptions,
  TabsCreateOptions,
  TabsExecOptions,
  TabsFocusOptions,
  TabsHtmlOptions,
  TabsInputOptions,
  TabsListOptions,
  TabsLogsOptions,
  TabsNavigateOptions,
  TabsRefreshOptions,
  TabsRequestsOptions,
  TabsScreenshotOptions,
  TabsSelectOptions,
  TabsStorageOptions
} from './definitions/tab';

export type {
  CaptureScreenshotData,
  ClickElementByTextData,
  ClickElementData,
  CreateTabData,
  ExecuteScriptData,
  FillInputData,
  GetTabRequestsData,
  NavigateTabData,
  TabIdData,
  TabsClickOptions,
  TabsCloseOptions,
  TabsCreateOptions,
  TabsExecOptions,
  TabsFocusOptions,
  TabsHtmlOptions,
  TabsInputOptions,
  TabsListOptions,
  TabsLogsOptions,
  TabsNavigateOptions,
  TabsRefreshOptions,
  TabsRequestsOptions,
  TabsScreenshotOptions,
  TabsSelectOptions,
  TabsStorageOptions
};

export type CommandHandler<T extends ProtocolCommand> = (data: CommandDataType<T>) => Promise<unknown>;

export type CommandHandlerMap = {
  [K in ProtocolCommand]: CommandHandler<K>;
};

export type RegisterData = {
  extensionId: string;
  installationId: string;
  profileName: string;
};

export type CommandDataMap = {
  [ProtocolCommand.TAB_LIST]: EmptyObject;
  [ProtocolCommand.TAB_EXEC]: ExecuteScriptData;
  [ProtocolCommand.TAB_CLOSE]: TabIdData;
  [ProtocolCommand.TAB_FOCUS]: TabIdData;
  [ProtocolCommand.TAB_CREATE]: CreateTabData;
  [ProtocolCommand.TAB_REFRESH]: TabIdData;
  [ProtocolCommand.TAB_NAVIGATE]: NavigateTabData;
  [ProtocolCommand.TAB_SCREENSHOT]: CaptureScreenshotData;
  [ProtocolCommand.TAB_HTML]: EmptyObject;
  [ProtocolCommand.TAB_LOGS]: TabIdData;
  [ProtocolCommand.CLEAR_TAB_LOGS]: TabIdData;
  [ProtocolCommand.TAB_REQUESTS]: GetTabRequestsData;
  [ProtocolCommand.CLEAR_TAB_REQUESTS]: TabIdData;
  [ProtocolCommand.TAB_STORAGE]: TabIdData;
  [ProtocolCommand.TAB_CLICK]: ClickElementData;
  [ProtocolCommand.CLICK_ELEMENT_BY_TEXT]: ClickElementByTextData;
  [ProtocolCommand.TAB_INPUT]: FillInputData;
  [ProtocolCommand.START_LOGGING]: TabIdData;
  [ProtocolCommand.STOP_LOGGING]: TabIdData;
  [ProtocolCommand.RELOAD_EXTENSION]: EmptyObject;
  [ProtocolCommand.GET_PROFILE_INFO]: EmptyObject;
  [ProtocolCommand.REGISTER]: RegisterData;
  [ProtocolCommand.PING]: EmptyObject;
};

type CommandRequestMap = {
  [K in ProtocolCommand]: {
    command: K;
    data: CommandDataMap[K];
  };
};

export type CommandRequest = CommandRequestMap[ProtocolCommand];

export type CommandDataType<T extends ProtocolCommand> = CommandDataMap[T];
