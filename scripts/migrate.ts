import "dotenv/config";
import { getPool } from "../src/lib/db";

async function migrate() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. organizations
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 2. api_keys
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        key_hash TEXT NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_used_at TIMESTAMPTZ
      )
    `);

    // 3. teams
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        parent_team_id UUID REFERENCES teams(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 4. agents
    await client.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        team_id UUID REFERENCES teams(id),
        external_id TEXT NOT NULL,
        agent_type TEXT NOT NULL CHECK (agent_type IN ('human', 'ai')),
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (org_id, external_id)
      )
    `);

    // 5. categories (seed data)
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        psiu_quadrant TEXT NOT NULL,
        description TEXT NOT NULL,
        display_order INT NOT NULL
      )
    `);

    // 6. pips
    await client.query(`
      CREATE TABLE IF NOT EXISTS pips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        team_id UUID REFERENCES teams(id),
        agent_id UUID NOT NULL REFERENCES agents(id),
        task_description TEXT,
        pip_text TEXT NOT NULL,
        severity INT NOT NULL DEFAULT 3 CHECK (severity BETWEEN 1 AND 5),
        category_id INT REFERENCES categories(id),
        classification_confidence FLOAT,
        classification_rationale TEXT,
        admin_category_id INT REFERENCES categories(id),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'spam')),
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        classified_at TIMESTAMPTZ
      )
    `);

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS pips_org_submitted_idx ON pips(org_id, submitted_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS pips_category_idx ON pips(org_id, category_id, submitted_at DESC)`);

    // Seed 12 categories
    await client.query(`
      INSERT INTO categories (id, name, slug, psiu_quadrant, description, display_order)
      VALUES
        (1,  'Sales / Repeat Sales',            'sales-repeat-sales',         'P',  'Friction around customer retention, renewals, and repeat purchases.',                                   1),
        (2,  'Brand Awareness / Market Clout',  'brand-awareness',            'P',  'Friction around brand recognition and market influence.',                                               2),
        (3,  'Quality / Efficiency',            'quality-efficiency',         'S',  'Friction around consistent high-quality output, rework, and waste.',                                   3),
        (4,  'Processes / Systems',             'processes-systems',          'S',  'Friction caused by cumbersome, missing, or ineffective processes and systems.',                        4),
        (5,  'Metrics / Insight',               'metrics-insight',            'I',  'Friction around having clear, timely, and accurate data for decision-making.',                         5),
        (6,  'Strategic Clarity / Priorities',  'strategic-clarity',          'I',  'Friction caused by unclear strategy, conflicting priorities, and poor strategic communication.',       6),
        (7,  'Shared Vision / Values',          'shared-vision-values',       'U',  'Friction caused by unclear or unenforced values and disconnected organizational culture.',             7),
        (8,  'Communications / Teamwork',       'communications-teamwork',    'U',  'Friction caused by poor communication, coordination failures, and siloed teams.',                     8),
        (9,  'Throughput / Production',         'throughput-production',      'PS', 'Friction around output speed, bottlenecks, and sustainable pace.',                                    9),
        (10, 'Innovation / Disruption',         'innovation-disruption',      'PI', 'Friction around the ability to innovate and bring new ideas to market.',                              10),
        (11, 'Staff Recruiting / Retention',    'staff-recruiting-retention', 'IU', 'Friction caused by inability to attract or keep the right talent.',                                  11),
        (12, 'Structure / Accountability',      'structure-accountability',   'SU', 'Friction caused by unclear ownership, ambiguous accountability, and misaligned structure.',          12)
      ON CONFLICT (id) DO NOTHING
    `);

    await client.query("COMMIT");
    console.log("✅ Migration complete");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
