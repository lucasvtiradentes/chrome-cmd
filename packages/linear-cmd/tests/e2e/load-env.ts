import * as dotenv from 'dotenv';
import * as path from 'path';

if (!process.env.CI) {
  const envFile = '.env.e2e';
  dotenv.config({ path: path.join(__dirname, `../../${envFile}`), quiet: true });
} else {
  console.log('In CI, skipping env file loading');
}
