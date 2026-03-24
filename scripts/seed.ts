import "dotenv/config";
import { createHash, randomBytes } from "crypto";
import { getPool } from "../src/lib/db";

async function seed() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create demo organization
    const orgRes = await client.query<{ id: string }>(
      `INSERT INTO organizations (name, slug) VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ["Organizational Physics", "org-physics"]
    );
    const orgId = orgRes.rows[0].id;
    console.log(`Org ID: ${orgId}`);

    // Create API key
    const plainKey = `em_demo_${randomBytes(16).toString("hex")}`;
    const keyHash = createHash("sha256").update(plainKey).digest("hex");

    const existingKey = await client.query(
      `SELECT id FROM api_keys WHERE org_id = $1 AND name = 'Demo Key' LIMIT 1`,
      [orgId]
    );

    if (existingKey.rows.length === 0) {
      await client.query(
        `INSERT INTO api_keys (org_id, name, key_hash) VALUES ($1, $2, $3)`,
        [orgId, "Demo Key", keyHash]
      );
      console.log(`\n🔑 Demo API Key (save this — shown only once):\n  ${plainKey}\n`);
    } else {
      console.log("(API key already exists — not regenerating)");
    }

    // Create teams
    const teamNames = ["Leadership", "Engineering", "Sales", "Operations"];
    const teamIds: Record<string, string> = {};
    for (const name of teamNames) {
      const res = await client.query<{ id: string }>(
        `INSERT INTO teams (org_id, name) VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [orgId, name]
      );
      if (res.rows.length > 0) teamIds[name] = res.rows[0].id;
    }
    // Fetch existing team IDs if already inserted
    const existingTeams = await client.query<{ id: string; name: string }>(
      `SELECT id, name FROM teams WHERE org_id = $1`,
      [orgId]
    );
    for (const t of existingTeams.rows) teamIds[t.name] = t.id;

    // Create agents
    const agentDefs = [
      { external_id: "lex", agent_type: "human", name: "Lex Sisney", team: "Leadership" },
      { external_id: "sarah-eng", agent_type: "human", name: "Sarah Chen", team: "Engineering" },
      { external_id: "mike-sales", agent_type: "human", name: "Mike Torres", team: "Sales" },
      { external_id: "ops-lead", agent_type: "human", name: "Jordan Kim", team: "Operations" },
      { external_id: "claude-desktop", agent_type: "ai", name: "Claude (Desktop)", team: "Leadership" },
      { external_id: "n8n-workflow", agent_type: "ai", name: "n8n Workflow Agent", team: "Engineering" },
    ];

    const agentIds: Record<string, string> = {};
    for (const a of agentDefs) {
      const res = await client.query<{ id: string }>(
        `INSERT INTO agents (org_id, team_id, external_id, agent_type, name)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (org_id, external_id) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [orgId, teamIds[a.team], a.external_id, a.agent_type, a.name]
      );
      agentIds[a.external_id] = res.rows[0].id;
    }

    // Seed demo PIPs — pre-classified, distributed across categories
    const pips = [
      // Strategic Clarity (6) — most elevated, avg ~4.2
      { text: "I wasn't sure whether to prioritize Q2 pipeline work or the product launch prep. There's no ranked priority list and both feel urgent.", severity: 5, category_id: 6, team: "Leadership", agent: "lex", task: "Q2 planning session", confidence: 0.93, rationale: "No ranked priority list causing decision paralysis is a Strategic Clarity failure." },
      { text: "Our strategy changed from enterprise to SMB but the OKRs haven't been updated to reflect this. We're measuring against the old strategy.", severity: 4, category_id: 6, team: "Leadership", agent: "claude-desktop", task: "Quarterly OKR review", confidence: 0.91, rationale: "Misaligned OKRs following a strategy shift is a Strategic Clarity gap." },
      { text: "Two executives gave me conflicting direction on this project. I don't know whose guidance to follow.", severity: 5, category_id: 6, team: "Engineering", agent: "sarah-eng", task: "Feature scoping", confidence: 0.89, rationale: "Conflicting executive direction signals unclear strategic alignment." },
      { text: "I've been asked to work on three 'top priority' initiatives simultaneously. We can't have three top priorities.", severity: 4, category_id: 6, team: "Sales", agent: "mike-sales", task: "Monthly planning", confidence: 0.90, rationale: "Multiple 'top priority' items is a direct Strategic Clarity / Priorities failure." },

      // Processes / Systems (4) — elevated, avg ~3.8
      { text: "I had to pull customer data from Salesforce, our billing system, and a manual spreadsheet to prep for this call. Should be one place.", severity: 4, category_id: 4, team: "Sales", agent: "mike-sales", task: "Customer renewal prep", confidence: 0.91, rationale: "Fragmented data across multiple systems is a Processes / Systems failure." },
      { text: "Every time we onboard a new client we reinvent the process. There's no documented onboarding playbook.", severity: 4, category_id: 4, team: "Operations", agent: "ops-lead", task: "Client onboarding", confidence: 0.88, rationale: "Lack of standardized onboarding process is a Processes / Systems gap." },
      { text: "The approval workflow for vendor contracts has 7 steps and involves 5 people for decisions under $5k. It needs a tiered model.", severity: 3, category_id: 4, team: "Operations", agent: "ops-lead", task: "Vendor contract approval", confidence: 0.89, rationale: "Overly complex approval process for low-stakes decisions is a process design failure." },
      { text: "Our engineering deployment process has no rollback plan documented. Every deployment feels risky.", severity: 4, category_id: 4, team: "Engineering", agent: "n8n-workflow", task: "Production deployment", confidence: 0.87, rationale: "Missing rollback procedure is a Processes / Systems gap." },

      // Communications / Teamwork (8) — moderate, avg ~3.2
      { text: "Found out the sales team made a commitment to a feature we haven't built yet. Engineering wasn't in the loop until the customer complained.", severity: 4, category_id: 8, team: "Engineering", agent: "sarah-eng", task: "Customer escalation response", confidence: 0.92, rationale: "Commitment made without cross-team communication is a teamwork failure." },
      { text: "Two engineers built the same internal tool independently this week. Total of 6 days of work duplicated.", severity: 3, category_id: 8, team: "Engineering", agent: "n8n-workflow", task: "Internal tooling audit", confidence: 0.90, rationale: "Duplicated work due to lack of coordination is a Communications / Teamwork failure." },
      { text: "The meeting summary from last week's leadership session never got distributed. I'm making decisions based on what I remember.", severity: 3, category_id: 8, team: "Leadership", agent: "claude-desktop", task: "Follow-up actions", confidence: 0.88, rationale: "Information not distributed after meetings is a communications gap." },

      // Structure / Accountability (12) — moderate
      { text: "This initiative has been flagged as off-track for three weeks but no one has authority to make the call to cut scope. It needs a clear owner.", severity: 4, category_id: 12, team: "Leadership", agent: "lex", task: "Portfolio review", confidence: 0.94, rationale: "Initiative without a clear owner or decision authority is a Structure / Accountability failure." },
      { text: "I completed my part of this deliverable but have no idea if anyone is accountable for the overall output. It might fall through the cracks.", severity: 3, category_id: 12, team: "Operations", agent: "ops-lead", task: "Cross-functional deliverable", confidence: 0.91, rationale: "Unclear end-to-end ownership is a Structure / Accountability gap." },
      { text: "Three teams each think they own the customer success metrics. The result is nobody owns them.", severity: 4, category_id: 12, team: "Sales", agent: "mike-sales", task: "Metrics review", confidence: 0.93, rationale: "Overlapping ownership without resolution leads to no accountability." },

      // Metrics / Insight (5) — moderate
      { text: "I needed to report on customer health this week but we don't have a real-time health score. I estimated from gut feel.", severity: 4, category_id: 5, team: "Sales", agent: "mike-sales", task: "Customer health report", confidence: 0.92, rationale: "No real-time customer health metrics is a Metrics / Insight gap." },
      { text: "We have no idea if our onboarding improvement initiative is working. We launched it 6 weeks ago and have zero data on outcomes.", severity: 3, category_id: 5, team: "Operations", agent: "ops-lead", task: "Initiative review", confidence: 0.90, rationale: "No measurement framework for an active initiative is a Metrics gap." },

      // Throughput / Production (9) — lower
      { text: "Every engineering decision above $200 needs VP approval. It creates a queue and slows the team to a crawl.", severity: 4, category_id: 9, team: "Engineering", agent: "sarah-eng", task: "Sprint planning", confidence: 0.88, rationale: "Low-threshold approval requirements creating throughput bottlenecks." },
      { text: "I'm waiting on one person to unblock three different workstreams simultaneously. This person is a chokepoint.", severity: 3, category_id: 9, team: "Operations", agent: "ops-lead", task: "Cross-functional execution", confidence: 0.91, rationale: "Single-person bottleneck limiting throughput across multiple streams." },

      // Quality / Efficiency (3)
      { text: "I redid this analysis because the data in the dashboard was stale. No indication of when data was last refreshed.", severity: 3, category_id: 3, team: "Leadership", agent: "claude-desktop", task: "Executive analysis", confidence: 0.87, rationale: "Stale data causing rework is a quality and efficiency failure." },
      { text: "The spec I received had 4 errors that weren't caught in review. I spent 2 days building the wrong thing.", severity: 4, category_id: 3, team: "Engineering", agent: "sarah-eng", task: "Feature development", confidence: 0.89, rationale: "Insufficient spec quality control leading to rework is a Quality / Efficiency failure." },

      // Staff Recruiting / Retention (11)
      { text: "The lead engineer role has been open for 5 months. I'm doing my job plus half of theirs. This is not sustainable.", severity: 5, category_id: 11, team: "Engineering", agent: "sarah-eng", task: "Q2 resource planning", confidence: 0.95, rationale: "Long-open critical role forcing unsustainable capacity is a Recruiting gap." },

      // Innovation / Disruption (10)
      { text: "A direct competitor just launched an AI-native version of our core product. We've been talking about this internally for a year with no action.", severity: 5, category_id: 10, team: "Leadership", agent: "lex", task: "Competitive review", confidence: 0.91, rationale: "Competitor shipping what we've been planning is an Innovation / Disruption failure." },

      // Shared Vision / Values (7)
      { text: "I made a decision based on what I thought our values meant and was told I was wrong. But they're not written down anywhere in actionable form.", severity: 3, category_id: 7, team: "Operations", agent: "ops-lead", task: "Client decision", confidence: 0.88, rationale: "Values not translated into decision-making guidance is a Shared Vision / Values gap." },
    ];

    const checkExisting = await client.query(
      `SELECT COUNT(*) as count FROM pips WHERE org_id = $1`,
      [orgId]
    );

    if (parseInt(checkExisting.rows[0].count) > 0) {
      console.log("PIPs already seeded — skipping");
    } else {
      for (const pip of pips) {
        const daysAgo = Math.floor(Math.random() * 21); // last 3 weeks
        await client.query(
          `INSERT INTO pips (org_id, team_id, agent_id, task_description, pip_text, severity, category_id,
             classification_confidence, classification_rationale, status, submitted_at, classified_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active',
             NOW() - ($10 || ' days')::INTERVAL,
             NOW() - ($10 || ' days')::INTERVAL + INTERVAL '30 seconds')`,
          [
            orgId,
            teamIds[pip.team],
            agentIds[pip.agent],
            pip.task,
            pip.text,
            pip.severity,
            pip.category_id,
            pip.confidence,
            pip.rationale,
            daysAgo,
          ]
        );
      }
      console.log(`✅ Seeded ${pips.length} demo PIPs`);
    }

    await client.query("COMMIT");
    console.log("\n✅ Seed complete");
    console.log(`\nOrg: Organizational Physics`);
    console.log(`Dashboard: http://localhost:3000/dashboard`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
