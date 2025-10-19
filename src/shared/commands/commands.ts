export enum ChromeCommand {
  LIST_TABS = 'list_tabs',
  CLOSE_TAB = 'close_tab',
  ACTIVATE_TAB = 'activate_tab',
  CREATE_TAB = 'create_tab',
  RELOAD_TAB = 'reload_tab',
  NAVIGATE_TAB = 'navigate_tab',

  EXECUTE_SCRIPT = 'execute_script',

  CAPTURE_SCREENSHOT = 'capture_screenshot',

  GET_TAB_LOGS = 'get_tab_logs',
  CLEAR_TAB_LOGS = 'clear_tab_logs',
  GET_TAB_REQUESTS = 'get_tab_requests',
  CLEAR_TAB_REQUESTS = 'clear_tab_requests',
  START_LOGGING = 'start_logging',
  STOP_LOGGING = 'stop_logging',

  GET_STORAGE = 'get_storage',

  CLICK_ELEMENT = 'click_element',
  CLICK_ELEMENT_BY_TEXT = 'click_element_by_text',
  FILL_INPUT = 'fill_input',

  RELOAD_EXTENSION = 'reload_extension',

  REGISTER = 'register',

  GET_PROFILE_INFO = 'get_profile_info',

  PING = 'ping'
}

export type ChromeCommandValue = `${ChromeCommand}`;
