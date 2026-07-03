/** Avoid leaking internal exception text to clients in production. */
export function publicErrorMessage(err, fallback, env) {
  if (env?.ENVIRONMENT !== 'production') {
    return err?.message || fallback;
  }
  return fallback;
}
