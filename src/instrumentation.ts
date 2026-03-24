import { readFileSync } from "fs";
import { join } from "path";

// Next.js instrumentation runs before env vars are fully propagated to process.env
// in dev mode. Load .env.local explicitly so the worker has access to API keys.
function loadEnvLocal() {
  try {
    const envPath = join(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local not present — no-op
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    loadEnvLocal();
    const { startWorker } = await import("./lib/worker");
    startWorker().catch((err) => {
      console.error("[instrumentation] Worker failed to start:", err);
    });
  }
}
