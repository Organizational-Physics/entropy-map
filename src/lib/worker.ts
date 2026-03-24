import { PgBoss } from "pg-boss";
import { classifyPip } from "./classifier";
import { query } from "./db";

export const JOB_NAME = "classify-pip";

export interface ClassifyJobData {
  pipId: string;
  pipText: string;
  taskDescription?: string;
}

function getConnectionString() {
  return (
    process.env.DATABASE_URL ||
    "postgresql://lexsisney@localhost:5432/entropy_map"
  );
}

// ── Worker (instrumentation context) ──────────────────────────────────────────

export async function startWorker(): Promise<void> {
  const boss = new PgBoss({ connectionString: getConnectionString() });
  boss.on("error", () => {}); // suppress noisy polling errors

  await boss.start();
  await boss.createQueue(JOB_NAME).catch(() => {}); // idempotent

  // v12: work() handler receives Job<T>[] (array)
  await boss.work<ClassifyJobData>(
    JOB_NAME,
    { teamSize: 2 },
    async (jobs) => {
      await Promise.all(
        jobs.map(async (job) => {
          const { pipId, pipText, taskDescription } = job.data;
          try {
            const result = await classifyPip(pipText, taskDescription);
            await query(
              `UPDATE pips
               SET category_id = $1,
                   classification_confidence = $2,
                   classification_rationale = $3,
                   classified_at = NOW()
               WHERE id = $4`,
              [result.category_id, result.confidence, result.rationale, pipId]
            );
            console.log(
              `[worker] ${pipId.slice(0, 8)} → ${result.category} (${result.confidence.toFixed(2)})`
            );
          } catch (err) {
            console.error(`[worker] classify ${pipId} failed:`, err);
            throw err;
          }
        })
      );
    }
  );

  console.log("[worker] Classification worker started");
}

// ── Sender (API route context) ────────────────────────────────────────────────
// Use globalThis to survive hot module reloads in Next.js dev.

declare global {
  // eslint-disable-next-line no-var
  var __pipSender: PgBoss | undefined;
}

async function getSender(): Promise<PgBoss> {
  if (!globalThis.__pipSender) {
    const sender = new PgBoss({ connectionString: getConnectionString() });
    sender.on("error", () => {});
    await sender.start();
    await sender.createQueue(JOB_NAME).catch(() => {});
    globalThis.__pipSender = sender;
  }
  return globalThis.__pipSender;
}

export async function enqueueClassification(data: ClassifyJobData): Promise<void> {
  const sender = await getSender();
  await sender.send(JOB_NAME, data, { retryLimit: 3, retryDelay: 10 });
}
