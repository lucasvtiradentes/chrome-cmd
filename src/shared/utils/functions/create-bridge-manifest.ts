import { BRIDGE_APP_NAME } from '../../constants/constants.js';
import { IS_DEV } from '../../constants/constants-node.js';

interface BridgeManifest {
  name: string;
  description: string;
  path: string;
  type: 'stdio';
  allowed_origins: string[];
}

export function createBridgeManifest(bridgePath: string, allowedOrigins: string[]): BridgeManifest {
  return {
    name: BRIDGE_APP_NAME,
    description: `Chrome CLI Bridge${IS_DEV ? ' (DEV)' : ''}`,
    path: bridgePath,
    type: 'stdio',
    allowed_origins: allowedOrigins
  };
}
