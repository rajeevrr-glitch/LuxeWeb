import { aiConfig } from "./visualiser-provider.mjs";
try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if (error.code !== "ENOENT")
    throw new Error("The private configuration file could not be loaded.");
}
const config = aiConfig();
console.log(
  JSON.stringify(
    {
      provider: config.provider,
      model: config.model,
      keyPresent: !!config.key?.trim(),
      enabled: config.enabled,
      blockedReason: config.blockedReason,
      maxAttempts: config.maxAttempts,
      providerRequestSent: false,
    },
    null,
    2,
  ),
);
