import type { IncomingMessage, ServerResponse } from "node:http";

export function createLocalInbox(options?: {
  env?: Record<string, string | undefined>;
  origin?: string;
}): (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;
