/**

 * Load project env: env/{project}.example.env → env/{project}/.env

 * Paste secrets in env/{project}/.env (gitignored).

 */

import { existsSync, readFileSync } from 'fs';

import { dirname, join, resolve } from 'path';

import { fileURLToPath } from 'url';



const __dirname = dirname(fileURLToPath(import.meta.url));

export const ENV_DIR = __dirname;

const REPO_ROOT = resolve(__dirname, '..');



const loadedFiles = new Set();



/** Standard paths users open — loaded last (highest priority). */

export const STANDARD_ENV_PATHS = {

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



export function loadEnvFile(filePath, { override = false } = {}) {

  const resolved = resolve(filePath);

  if (loadedFiles.has(resolved)) return false;

  if (!existsSync(resolved)) return false;



  const content = readFileSync(resolved, 'utf8');

  for (const line of content.split(/\r?\n/)) {

    applyEnvLine(line, override);

  }

  loadedFiles.add(resolved);

  return true;

}



export function resolveProjectEnvPath(project, kind = 'local') {

  if (kind === 'local' || kind === 'standard') {

    return STANDARD_ENV_PATHS[project] || join(ENV_DIR, project, '.env');

  }

  return join(ENV_DIR, `${project}.${kind}.env`);

}



/**

 * @param {'server'|'mobile'|'web'|'api'} project

 * @param {{ includeExample?: boolean }} [options]

 */

export function loadProjectEnv(project, options = {}) {

  const { includeExample = true } = options;



  if (includeExample) {

    loadEnvFile(resolveProjectEnvPath(project, 'example'), { override: false });

  }

  // Legacy flat files (deprecated; use env/{project}/.env)

  loadEnvFile(join(ENV_DIR, `${project}.local.env`), { override: true });

  loadEnvFile(STANDARD_ENV_PATHS[project] || join(ENV_DIR, project, '.env'), {

    override: true,

  });

}


