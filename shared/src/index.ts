/**
 * @chrome-cmd/shared
 * Shared types, enums, and schemas for chrome-cmd
 */

// Export command metadata
export {
  COMMAND_METADATA,
  type CommandMetadata,
  type CommandMetadataMap,
  formatCommandDetails,
  getCommandMetadata
} from './command-metadata';
// Export commands
export { ChromeCommand, type ChromeCommandValue } from './commands';
// Export constants
export { MEDIATOR_HOST, MEDIATOR_PORT, MEDIATOR_URL, NATIVE_APP_NAME, NATIVE_MANIFEST_FILENAME } from './constants';
// Export helpers
export {
  type CommandHandler,
  type CommandHandlerMap,
  createCommandRequest,
  dispatchCommand,
  escapeJavaScriptString,
  formatTimeAgo
} from './helpers';
// Export schemas
export {
  type CaptureScreenshotData,
  type ClickElementByTextData,
  type ClickElementData,
  type CommandDataMap,
  type CommandDataType,
  type CommandMessage,
  type CommandRequest,
  type CommandRequestMap,
  type CreateTabData,
  captureScreenshotDataSchema,
  clickElementByTextDataSchema,
  clickElementDataSchema,
  // Schema map
  commandDataSchemaMap,
  // Message schemas
  commandMessageSchema,
  commandRequestSchema,
  createTabDataSchema,
  // Inferred types
  type ExecuteScriptData,
  type ExtractCommandData,
  // Data schemas
  executeScriptDataSchema,
  type FillInputData,
  fillInputDataSchema,
  type GetTabRequestsData,
  getTabRequestsDataSchema,
  type NativeMessage,
  type NativeResponse,
  type NavigateTabData,
  navigateTabDataSchema,
  type ResponseMessage,
  responseMessageSchema,
  type TabIdData,
  type TypedCommandRequest,
  tabIdDataSchema,
  validateCommandData
} from './schemas';
// Export types
export type {
  CaptureScreenshotResponse,
  CreateTabResponse,
  HistoryItem,
  LogEntry,
  NetworkRequestEntry,
  StartLoggingResponse,
  StopLoggingResponse,
  StorageData,
  SuccessResponse,
  TabInfo
} from './types';
