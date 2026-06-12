import { buildApp } from "./app.js";
import { config } from "./config.js";
import { close, migrate } from "./db.js";
import { seedIfEmpty } from "./seed.js";

async function main(): Promise<void> {
  await migrate();
  await seedIfEmpty();

  const app = buildApp();
  await app.listen({ port: config.port, host: config.host });

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`received ${signal}, shutting down`);
    await app.close();
    await close();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("fatal startup error:", err);
  process.exit(1);
});
