import { BRIDGE_APP_NAME } from '../../constants/constants.js';
import { isDev } from './is-development-env.js';

interface BridgeManifest {
  name: string;
  description: string;
  path: string;
  type: 'stdio';
  allowed_origins: string[];
}

export function createBridgeManifest(bridgePath: string, allowedOrigins: string[]): BridgeManifest {
  return {
    name: `${BRIDGE_APP_NAME}${isDev() ? ' (DEV)' : ''}`,
    description: `Chrome CMD Bridge`,
    path: bridgePath,
    type: 'stdio',
    allowed_origins: allowedOrigins
  };
}
