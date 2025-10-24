import type { EmptyObject } from '../../shared/utils/types';
import type {
  CaptureScreenshotData,
  ClickElementByTextData,
  ClickElementData,
  CreateTabData,
  ExecuteScriptData,
  FillInputData,
  GetTabRequestsData,
  NavigateTabData,
  TabIdData
} from './definitions/tab';
import { ProtocolCommand } from './definitions.js';

export type ProtocolCommandHandler<T extends ProtocolCommand> = (data: ProtocolCommandDataType<T>) => Promise<unknown>;

export type ProtocolCommandHandlerMap = {
  [K in ProtocolCommand]: ProtocolCommandHandler<K>;
};

type ProtocolCommandDataMap = {
  [ProtocolCommand.TAB_LIST]: EmptyObject;
  [ProtocolCommand.TAB_EXEC]: ExecuteScriptData;
  [ProtocolCommand.TAB_CLOSE]: TabIdData;
  [ProtocolCommand.TAB_FOCUS]: TabIdData;
  [ProtocolCommand.TAB_CREATE]: CreateTabData;
  [ProtocolCommand.TAB_REFRESH]: TabIdData;
  [ProtocolCommand.TAB_NAVIGATE]: NavigateTabData;
  [ProtocolCommand.TAB_SCREENSHOT]: CaptureScreenshotData;
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
  [ProtocolCommand.PING]: EmptyObject;
};

type ProtocolCommandRequestMap = {
  [K in ProtocolCommand]: {
    command: K;
    data: ProtocolCommandDataMap[K];
  };
};

export type ProtocolCommandRequest = ProtocolCommandRequestMap[ProtocolCommand];

export type ProtocolCommandDataType<T extends ProtocolCommand> = ProtocolCommandDataMap[T];
