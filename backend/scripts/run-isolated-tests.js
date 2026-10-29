import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const explicitFiles = process.argv.slice(2);
const files = explicitFiles.length > 0
  ? explicitFiles
  : readdirSync(path.resolve('src/routes'))
      .filter((name) => name.endsWith('.test.js'))
      .map((name) => path.join('src/routes', name));

const isolatedUrl = 'mongodb://127.0.0.1:1/homelyserv_node_test?serverSelectionTimeoutMS=50';
const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
  shell: false,
  env: { ...process.env, DATABASE_URL: isolatedUrl, MONGODB_URI: isolatedUrl, NODE_ENV: 'test' },
});
process.exit(result.status ?? 1);
