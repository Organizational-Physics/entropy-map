import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { checkPipRateLimit } from "@/lib/rate-limit";
import { query } from "@/lib/db";
import { enqueueClassification } from "@/lib/worker";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

interface PipBody {
  pip_text: string;
  task_description?: string;
  severity?: number;
  agent_id?: string;
  agent_type?: "human" | "ai";
  agent_name?: string;
  team_id?: string;
}

export async function POST(request: NextRequest) {
  // Auth
  const auth = await validateApiKey(request.headers.get("authorization"));
  if (!auth.valid) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  // Rate limit
  const rl = checkPipRateLimit(auth.keyId!);
  if (!rl.allowed) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body: PipBody = await request.json();

  if (!body.pip_text?.trim()) {
    return Response.json({ error: "pip_text is required" }, { status: 400 });
  }

  if (body.severity !== undefined && (body.severity < 1 || body.severity > 5)) {
    return Response.json({ error: "severity must be 1–5" }, { status: 400 });
  }

  // Resolve or create agent
  const agentId = await resolveAgent(
    auth.orgId!,
    body.agent_id || "anonymous",
    body.agent_type || "human",
    body.agent_name || body.agent_id || "Anonymous",
    body.team_id || null
  );

  // Insert PIP
  const pipId = randomUUID();
  await query(
    `INSERT INTO pips (id, org_id, team_id, agent_id, task_description, pip_text, severity, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`,
    [
      pipId,
      auth.orgId!,
      body.team_id || null,
      agentId,
      body.task_description || null,
      body.pip_text.trim(),
      body.severity || 3,
    ]
  );

  // Enqueue async classification
  await enqueueClassification({
    pipId,
    pipText: body.pip_text.trim(),
    taskDescription: body.task_description,
  });

  return Response.json({ id: pipId, status: "accepted" }, { status: 202 });
}

async function resolveAgent(
  orgId: string,
  externalId: string,
  agentType: "human" | "ai",
  name: string,
  teamId: string | null
): Promise<string> {
  const existing = await query<{ id: string }>(
    `SELECT id FROM agents WHERE org_id = $1 AND external_id = $2 LIMIT 1`,
    [orgId, externalId]
  );
  if (existing.length > 0) return existing[0].id;

  const created = await query<{ id: string }>(
    `INSERT INTO agents (org_id, team_id, external_id, agent_type, name)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (org_id, external_id) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [orgId, teamId, externalId, agentType, name]
  );
  return created[0].id;
}
