/** Logs only the source, operation and error message (no user ids, emails or request bodies). */
export function logServerError(source: string, operation: string, error: unknown): void {
  // eslint-disable-next-line no-console
  console.error(`[${source}] ${operation}:`, error instanceof Error ? error.message : "unknown error");
}
