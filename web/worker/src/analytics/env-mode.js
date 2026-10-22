export function isProductionEnv(env) {
  return String(env?.ENVIRONMENT || '').toLowerCase() === 'production';
}

export function isDevelopmentEnv(env) {
  const mode = String(env?.ENVIRONMENT || '').toLowerCase();
  return mode === 'development' || mode === 'dev' || mode === 'test';
}
