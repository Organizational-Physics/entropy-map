import { NextRequest } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Public endpoint — returns data for the first org (single-tenant prototype)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const window = searchParams.get("window") || "30d";
  const teamId = searchParams.get("team") || null;

  const interval = windowToInterval(window);

  // Get org
  const orgs = await query<{ id: string; name: string }>(
    `SELECT id, name FROM organizations LIMIT 1`
  );
  if (orgs.length === 0) {
    return Response.json({ error: "No organization found" }, { status: 404 });
  }
  const org = orgs[0];

  const teamFilter = teamId ? `AND p.team_id = '${teamId}'` : "";

  // Signal map: category averages
  const signal = await query<{
    category_id: number;
    category_name: string;
    psiu_quadrant: string;
    avg_severity: number;
    pip_count: number;
  }>(
    `SELECT
       COALESCE(p.admin_category_id, p.category_id) AS category_id,
       c.name AS category_name,
       c.psiu_quadrant,
       ROUND(AVG(p.severity)::numeric, 2)::float AS avg_severity,
       COUNT(*)::int AS pip_count
     FROM pips p
     JOIN categories c ON c.id = COALESCE(p.admin_category_id, p.category_id)
     WHERE p.org_id = $1
       AND p.status = 'active'
       AND p.submitted_at > NOW() - INTERVAL '${interval}'
       AND COALESCE(p.admin_category_id, p.category_id) IS NOT NULL
       ${teamFilter}
     GROUP BY COALESCE(p.admin_category_id, p.category_id), c.name, c.psiu_quadrant
     ORDER BY avg_severity DESC`,
    [org.id]
  );

  // Patterns: categories with 3+ PIPs
  const patterns = signal.filter((s) => s.pip_count >= 3);

  // Recent PIPs (noise view)
  const pips = await query<{
    id: string;
    pip_text: string;
    severity: number;
    category_name: string | null;
    psiu_quadrant: string | null;
    agent_name: string;
    agent_type: string;
    team_name: string | null;
    submitted_at: string;
    classified_at: string | null;
    classification_confidence: number | null;
    classification_rationale: string | null;
  }>(
    `SELECT
       p.id,
       p.pip_text,
       p.severity,
       c.name AS category_name,
       c.psiu_quadrant,
       a.name AS agent_name,
       a.agent_type,
       t.name AS team_name,
       p.submitted_at,
       p.classified_at,
       p.classification_confidence,
       p.classification_rationale
     FROM pips p
     LEFT JOIN categories c ON c.id = COALESCE(p.admin_category_id, p.category_id)
     LEFT JOIN agents a ON a.id = p.agent_id
     LEFT JOIN teams t ON t.id = p.team_id
     WHERE p.org_id = $1
       AND p.status = 'active'
       AND p.submitted_at > NOW() - INTERVAL '${interval}'
       ${teamFilter}
     ORDER BY p.submitted_at DESC
     LIMIT 100`,
    [org.id]
  );

  // Teams for filter
  const teams = await query<{ id: string; name: string }>(
    `SELECT id, name FROM teams WHERE org_id = $1 ORDER BY name`,
    [org.id]
  );

  // Stats
  const stats = {
    total_pips: pips.length,
    classified_pips: pips.filter((p) => p.category_name).length,
    active_categories: signal.length,
    top_category: signal[0]?.category_name || null,
    top_category_score: signal[0]?.avg_severity || null,
    window,
  };

  return Response.json({ org, signal, patterns, pips, teams, stats });
}

function windowToInterval(w: string): string {
  const map: Record<string, string> = {
    "1d": "1 day",
    "7d": "7 days",
    "30d": "30 days",
    "90d": "90 days",
    "1y": "1 year",
  };
  return map[w] || "30 days";
}
