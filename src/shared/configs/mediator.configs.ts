export const MEDIATOR_CONFIGS = {
  PORT: 8765,
  HOST: 'localhost',
  PORT_START: 8765,
  PORT_END: 8774,
  RECONNECT_BASE_DELAY: 1000,
  MAX_RECONNECT_DELAY: 30000,
  REGISTER_COMMAND_DELAY: 100,
  KEEPALIVE_INTERVAL: 30000
  // get URL() {
  //   return `http://${this.HOST}:${this.PORT}`;
  // },
  // CONNECTION_TIMEOUT: 5000,
} as const;
