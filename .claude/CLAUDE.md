# Entropy Map — Static Reference

## Project Overview
Open-source standalone web app that creates a company-specific operational heat map based on the Organizational Physics Entropy Survey methodology. Captures PIPs (Potential Improvement Points) from human and AI agents, classifies them into 12 entropy categories, and surfaces patterns so management can take artful action.

**Repo:** `github.com/Organizational-Physics/entropy-map` (public)
**Stack:** Next.js / TypeScript
**Deploy:** Docker Compose (self-host primary) + Railway (one-click hosted)
**Full plan:** `/Users/lexsisney/Projects/entropy-map/project-plan.md`

## Business Model
- **Free / open-source:** Full app including AskLex advisor — community installs, OP methodology spreads
- **Hosted tier:** $/mo — Railway-hosted, no DevOps required
- **OrgPhysics.AI:** Consulting escalation — warm leads from AskLex, human-initiated via CTAs in dashboard
- **No automatic sync to OrgPhysics.AI** — data stays in-instance; privacy is a core design principle

## Architecture Decisions (all locked)
- **Runtime:** Standalone web app — self-hostable, not WordPress, not SaaS
- **Integration:** Universal REST API — any agent POSTs PIPs to one endpoint via named API key
- **Agent model:** Human and AI agents treated identically — same endpoint, same auth, same weighting
- **No standalone /submit form** — PIP capture embedded in agent's existing workflow (Slack /pip, Jira webhook, n8n node, system prompt snippet)
- **Classification:** Claude classifies PIPs async via pg-boss (PostgreSQL job queue — no Redis). Dedicated worker process in Docker Compose. Jobs survive container restarts and retry on failure. `classified_at = null` until worker completes. Admin can reclassify via admin_category_id override.
- **Async queue:** pg-boss — PostgreSQL-native, no Redis required. Two processes in Docker Compose: Next.js app + classification worker.
- **Rate limiting:** Leaky bucket per api_key on `POST /api/pips`. Rate limiter on `/api/coach` per api_key/session.
- **Bulk ingestion:** `POST /api/pips/bulk` — array of PIPs, same auth. For high-frequency AI workflows batching at job completion.
- **PIP coaching:** Two-tier real-time coaching on human channels — client heuristics (instant) + Claude semantic check (fires if heuristics pass). Non-blocking, never a gate. Client caches results by input text hash — repeated text never re-pings Claude. UX pattern from OrgPhysics.AI coached-textarea.tsx.
- **Patterns:** Computed dynamically (live query), not stored — v2 adds persistent pattern curation
- **Map views:** Noise (individual PIPs) + Signal (category averages); PSIU overlay is a toggle on Signal, not a third view
- **AskLex advisor:** Claude-powered chat in admin dashboard, grounded in Lex's OP methodology + org's own data. Context injection: top 5 PIPs by severity per elevated category, truncated to 200 chars each (deterministic, no vectors). Max ~60 PIPs injected. Nothing leaves the instance. V2: semantic retrieval.
- **OrgPhysics.AI handoff:** Two CTAs only — "Contact OrgPhysics.AI" + "Upload your Entropy Map." Human-initiated, intentional.

## Classification Prompt Approach (write at build time)
- System prompt: all 12 category definitions + 36 few-shot examples (3 per category, from project-plan.md appendix)
- Tiebreaker rule: classify to the *source* of the problem, not the symptom
- Output: structured JSON — `{ category, psiu_quadrant, confidence, rationale }`
- Low-confidence flagging: confidence < 0.6 → flag for admin review

## The 12 Entropy Categories + PSIU Mapping
| Category | PSIU Quadrant |
|---|---|
| Sales / Repeat Sales | P |
| Brand Awareness / Market Clout | P |
| Quality / Efficiency | S |
| Processes / Systems | S |
| Metrics / Insight | I |
| Strategic Clarity / Priorities | I |
| Shared Vision / Values | U |
| Communications / Teamwork | U |
| Throughput / Production | P\|S border |
| Innovation / Disruption | P\|I border |
| Staff Recruiting / Retention | I\|U border |
| Structure / Accountability | S\|U border |

## Data Schema

### `organizations`
`id, name, slug, created_at`
(api_key removed — see api_keys table)

### `api_keys`
`id, org_id, name, key_hash, is_active, created_at, last_used_at`
Multiple named keys per org. Revoke one key without affecting others. key_hash = SHA-256; plaintext never stored after creation.

### `teams`
`id, org_id, name, parent_team_id (nullable), created_at`
Supports nested sub-teams.

### `agents`
`id, org_id, team_id (nullable), external_id, agent_type (human|ai), name, created_at`
`external_id` = whatever ID the submitting system uses. Human and AI treated identically.

### `categories` *(seed data — 12 rows, never changes at runtime)*
`id, name, slug, psiu_quadrant (P|S|I|U|PS|PI|IU|SU), description, display_order`

### `pips`
```
id, org_id, team_id, agent_id
task_description          -- context of the task
pip_text                  -- raw response to "What would improve your outcomes?"
severity (1–5)            -- optional, default 3
category_id               -- Claude's classification
classification_confidence -- float 0–1; < 0.6 flagged for admin review
classification_rationale  -- Claude's one-sentence reasoning
admin_category_id         -- nullable override; takes precedence permanently
status (active|archived|spam)
submitted_at, classified_at
```

## PIP Capture
**Question:** "What would improve your outcomes with this task?"
**Severity (optional):** "How much did this impact your ability to complete the task? (1–5)"
Signal map score = average severity per category for selected time window.
Severity maps to Entropy Survey 0–5 scale — readings are directly comparable.

## Key Concepts
- **PIP** — Potential Improvement Point; atomic unit; task friction logged by human or AI agent
- **Noise view** — individual PIPs plotted on the map
- **Signal view** — category averages; PSIU overlay toggle reveals which organizational force is deficient
- **Pattern** — 3+ PIPs in the same category within a time window (computed, not stored in MVP)
- **Entropy score** — average severity (1–5) per category; 0 = no entropy, 5 = high entropy
- **AskLex** — in-app AI advisor; answers "what do I do about this?" using org's own data + OP methodology

## OrgPhysics.AI Export Fields
For human-initiated upload: `effective_category_id`, `psiu_quadrant` (join), `severity`, `submitted_at`, `agent_type`, `team_id`, `pip_text` — flat join format.
