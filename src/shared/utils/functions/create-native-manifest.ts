import { NATIVE_APP_NAME } from '../../constants/constants.js';
import { IS_DEV } from '../../constants/constants-node.js';

interface NativeManifest {
  name: string;
  description: string;
  path: string;
  type: 'stdio';
  allowed_origins: string[];
}

export function createNativeManifest(hostPath: string, allowedOrigins: string[]): NativeManifest {
  return {
    name: NATIVE_APP_NAME,
    description: `Chrome CLI Native Messaging Host${IS_DEV ? ' (DEV)' : ''}`,
    path: hostPath,
    type: 'stdio',
    allowed_origins: allowedOrigins
  };
}
