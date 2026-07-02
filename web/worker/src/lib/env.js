/** Shared Worker env accessors — used across monetization + notifications. */

export function getPublicWebBase(env) {
  return env?.PUBLIC_WEB_BASE?.trim() || 'https://cursorunofficial.news';
}

export function getPublicApiBase(env) {
  return env?.PUBLIC_API_BASE?.trim() || 'https://cursorunofficial.news/api';
}
