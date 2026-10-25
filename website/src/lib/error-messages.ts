/** Keep internal exception text out of public error screens. */
export function friendlyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (/fetch|network|failed to load/i.test(message)) {
    return "We couldn't reach our servers. Please check your connection and try again.";
  }
  if (/timeout/i.test(message)) return "That took too long to respond. Please try again.";
  return "Something didn't load the way it should.";
}
