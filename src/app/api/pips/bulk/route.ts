import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { checkPipRateLimit } from "@/lib/rate-limit";
import { query } from "@/lib/db";
import { enqueueClassification } from "@/lib/worker";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request.headers.get("authorization"));
  if (!auth.valid) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  const rl = checkPipRateLimit(auth.keyId!);
  if (!rl.allowed) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const pips = Array.isArray(body) ? body : body.pips;

  if (!Array.isArray(pips) || pips.length === 0) {
    return Response.json({ error: "Expected array of PIPs" }, { status: 400 });
  }

  if (pips.length > 50) {
    return Response.json({ error: "Max 50 PIPs per bulk request" }, { status: 400 });
  }

  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const pip of pips) {
    if (!pip.pip_text?.trim()) {
      results.push({ id: "", status: "error", error: "pip_text required" });
      continue;
    }

    const agentId = await resolveAgent(
      auth.orgId!,
      pip.agent_id || "anonymous",
      pip.agent_type || "ai",
      pip.agent_name || pip.agent_id || "Anonymous",
      pip.team_id || null
    );

    const pipId = randomUUID();
    await query(
      `INSERT INTO pips (id, org_id, team_id, agent_id, task_description, pip_text, severity, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`,
      [pipId, auth.orgId!, pip.team_id || null, agentId, pip.task_description || null, pip.pip_text.trim(), pip.severity || 3]
    );

    await enqueueClassification({ pipId, pipText: pip.pip_text.trim(), taskDescription: pip.task_description });
    results.push({ id: pipId, status: "accepted" });
  }

  return Response.json({ accepted: results.filter((r) => r.status === "accepted").length, results }, { status: 202 });
}

async function resolveAgent(
  orgId: string, externalId: string, agentType: "human" | "ai",
  name: string, teamId: string | null
): Promise<string> {
  const res = await query<{ id: string }>(
    `INSERT INTO agents (org_id, team_id, external_id, agent_type, name)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (org_id, external_id) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [orgId, teamId, externalId, agentType, name]
  );
  return res[0].id;
}
