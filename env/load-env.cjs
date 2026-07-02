/**

 * CommonJS env loader for Metro (mobile/metro.config.js).

 * ESM entry: load-env.js

 */

const { existsSync, readFileSync } = require('fs');

const { join, resolve } = require('path');



const ENV_DIR = __dirname;

const loadedFiles = new Set();



const STANDARD_ENV_PATHS = {

  server: join(ENV_DIR, 'server', '.env'),

  mobile: join(ENV_DIR, 'mobile', '.env'),

  web: join(ENV_DIR, 'web', '.env'),

  api: join(ENV_DIR, 'api', '.env'),

};



function applyEnvLine(line, override) {

  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith('#')) return;

  const eq = trimmed.indexOf('=');

  if (eq === -1) return;

  const key = trimmed.slice(0, eq).trim();

  if (!key || (!override && process.env[key] !== undefined)) return;

  let value = trimmed.slice(eq + 1).trim();

  if (

    (value.startsWith('"') && value.endsWith('"')) ||

    (value.startsWith("'") && value.endsWith("'"))

  ) {

    value = value.slice(1, -1);

  }

  process.env[key] = value;

}



function loadEnvFile(filePath, { override = false } = {}) {

  const resolved = resolve(filePath);

  if (loadedFiles.has(resolved) || !existsSync(resolved)) return false;

  const content = readFileSync(resolved, 'utf8');

  for (const line of content.split(/\r?\n/)) {

    applyEnvLine(line, override);

  }

  loadedFiles.add(resolved);

  return true;

}



function loadProjectEnv(project, options = {}) {

  const { includeExample = true } = options;

  if (includeExample) {

    loadEnvFile(join(ENV_DIR, `${project}.example.env`), { override: false });

  }

  loadEnvFile(join(ENV_DIR, `${project}.local.env`), { override: true });

  loadEnvFile(STANDARD_ENV_PATHS[project] || join(ENV_DIR, project, '.env'), {

    override: true,

  });

}



module.exports = { loadProjectEnv, ENV_DIR, STANDARD_ENV_PATHS };


