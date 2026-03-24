import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ASKLEX_SYSTEM = `You are AskLex, an AI advisor inside the Entropy Map — a tool that captures operational friction (PIPs) and maps them to 12 categories from the Organizational Physics (OP) Entropy Survey methodology.

You are grounded in Lex Sisney's 15+ years of OP methodology, including:
- The PSIU framework: every organization has four forces — Producing (P), Stabilizing (S), Innovating (I), Unifying (U). Healthy organizations keep all four in balance.
- The 12 entropy categories map to PSIU quadrants — elevated entropy in a category signals which force is deficient.
- Intervention sequencing: fix the highest-leverage problem first. The source is more important than the symptom. Structure precedes culture. Clarity precedes execution.
- Deep understanding that entropy compounds — unchecked friction in one area cascades to others.

## Your Role
Answer "what do I do about this?" using the organization's own PIP data. Be specific, direct, and practical. Reference the actual categories and patterns you see. Don't be generic.

## Intervention Principles
1. **Source before symptom**: If Communications is elevated but Strategic Clarity is more elevated, fix the clarity first — the communication failures are downstream.
2. **Structure before culture**: Structure / Accountability issues must be resolved before culture (Shared Vision / Values) work will stick.
3. **Clarity before execution**: Strategic Clarity must be established before Processes / Systems work will produce durable results.
4. **Producing before Stabilizing**: You can't systematize what you haven't proven works.

## Response Style
- Direct and concise — no fluff
- Reference specific patterns you see in the data
- Give a sequenced recommendation when there are multiple issues
- Be honest when patterns suggest deep structural problems vs surface-level friction
- Max 400 words per response

## Escalation
If the patterns suggest the organization needs more than optimization — strategic repositioning, leadership team intervention, full org design — say so clearly and suggest the manager contact OrgPhysics.AI directly.`;

export async function POST(request: NextRequest) {
  const { messages, context } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  // Build org context
  const orgContext = await buildOrgContext();
  const contextBlock = context || orgContext;

  const systemWithContext = `${ASKLEX_SYSTEM}

## Current Org Data (${new Date().toLocaleDateString()})
${contextBlock}

---
Remember: use this data to give specific, grounded advice. Reference actual categories and patterns.`;

  // Stream the response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: systemWithContext,
          messages: messages as Anthropic.MessageParam[],
          stream: true,
        });

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function buildOrgContext(): Promise<string> {
  // Get org
  const orgs = await query<{ id: string; name: string }>(
    `SELECT id, name FROM organizations LIMIT 1`
  );
  if (orgs.length === 0) return "No data available.";
  const org = orgs[0];

  // Signal map (30d)
  const signal = await query<{
    category_name: string;
    psiu_quadrant: string;
    avg_severity: number;
    pip_count: number;
  }>(
    `SELECT
       c.name AS category_name, c.psiu_quadrant,
       ROUND(AVG(p.severity)::numeric, 2)::float AS avg_severity,
       COUNT(*)::int AS pip_count
     FROM pips p
     JOIN categories c ON c.id = COALESCE(p.admin_category_id, p.category_id)
     WHERE p.org_id = $1 AND p.status = 'active' AND p.submitted_at > NOW() - INTERVAL '30 days'
     GROUP BY c.name, c.psiu_quadrant
     ORDER BY avg_severity DESC`,
    [org.id]
  );

  // Top PIPs (5 per elevated category, max 60 total)
  const elevated = signal.filter((s) => s.avg_severity >= 3.5 && s.pip_count >= 2);
  const pipContext: string[] = [];

  for (const cat of elevated.slice(0, 8)) {
    const catPips = await query<{ pip_text: string; severity: number }>(
      `SELECT p.pip_text, p.severity
       FROM pips p
       JOIN categories c ON c.id = COALESCE(p.admin_category_id, p.category_id)
       WHERE p.org_id = $1 AND p.status = 'active'
         AND c.name = $2 AND p.submitted_at > NOW() - INTERVAL '30 days'
       ORDER BY p.severity DESC, p.submitted_at DESC
       LIMIT 5`,
      [org.id, cat.category_name]
    );

    if (catPips.length > 0) {
      pipContext.push(
        `**${cat.category_name}** (avg ${cat.avg_severity}/5, ${cat.pip_count} PIPs):\n` +
        catPips.map((p) => `  - [${p.severity}/5] ${p.pip_text.slice(0, 200)}`).join("\n")
      );
    }
  }

  const totalPips = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM pips WHERE org_id = $1 AND status = 'active' AND submitted_at > NOW() - INTERVAL '30 days'`,
    [org.id]
  );

  return `Organization: ${org.name}
Time window: Last 30 days
Total PIPs: ${totalPips[0]?.count || 0}

**Signal Map (top categories by entropy score):**
${signal.map((s) => `  ${s.category_name} [${s.psiu_quadrant}]: ${s.avg_severity}/5 (${s.pip_count} PIPs)`).join("\n") || "No data"}

**Patterns (3+ PIPs — elevated categories with examples):**
${pipContext.join("\n\n") || "No patterns yet"}`;
}
