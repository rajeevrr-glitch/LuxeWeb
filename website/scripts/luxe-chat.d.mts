import type { IncomingMessage, ServerResponse } from "node:http";

type ChatEnvironment = Record<string, string | undefined>;
type ChatConfiguration = { enabled: boolean; key: string; model: string; dailyLimit: number };
export function chatConfig(env?: ChatEnvironment): ChatConfiguration;
export function geminiChat(
  question: string,
  config: ChatConfiguration,
  fetcher?: typeof fetch,
): Promise<string>;
export function createLuxeChat(options?: {
  env?: ChatEnvironment;
  origins?: string[];
  counterFile?: string;
  fetcher?: typeof fetch;
  now?: () => number;
  bodyReadMs?: number;
}): { handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> };
