# Entropy Map — Project Plan

*Organizational Physics*

---

## Executive Summary

The Entropy Map is an open-source standalone app that gives organizations a real-time operational heat map of their daily friction. Human and AI agents submit brief improvement notes — called PIPs (Potential Improvement Points) — as they complete tasks. Claude classifies each PIP into one of 12 entropy categories drawn from the Organizational Physics Entropy Survey methodology. Management sees the map, spots patterns, and takes artful action before entropy compounds.

The app is the free, open-source data collection, visualization, and advisory layer. An embedded AI advisor — AskLex — is grounded in Lex Sisney's OP methodology and answers "what do I do about this?" directly within the org's own instance. For deeper strategic engagement, managers can contact OrgPhysics.AI or upload their Entropy Map for advanced analysis.

| | |
|---|---|
| **Runtime** | Standalone web app |
| **License** | Open-source core |
| **Phase** | MVP Planning Complete |

---

## The Problem

Every organization accumulates operational friction — unclear priorities, broken processes, misaligned teams, insufficient metrics. This friction is entropy: disorder that consumes energy without producing output. Most organizations feel it but cannot see it clearly enough to act on it systematically.

Three ways traditional approaches fail:

1. Periodic surveys capture a snapshot, not a continuous signal. By the time a pattern is visible, it is already entrenched.
2. Feedback is lost at the point of friction. The agent who experienced the problem moves on; the insight evaporates.
3. As AI agents proliferate inside organizations, they generate a completely invisible layer of operational friction. No existing tool captures it.

---

## The Solution

The Entropy Map turns every completed task into an opportunity to capture a PIP. Claude classifies it silently into one of 12 categories. Over time, the map surfaces which categories are generating the most friction across the organization.

### The Atomic Unit: PIP

A PIP (Potential Improvement Point) is the smallest unit of operational signal, captured by one question at task completion:

> **"What would improve your outcomes with this task?"**

With an optional severity follow-up:

> **"How much did this impact your ability to complete the task? (1–5)"**

### PIP Quality Coaching

Humans are lazy. Vague PIPs ("the meeting was bad") produce weak classifications and noisy maps. But enforcing quality gates causes abandonment. The solution is real-time, non-blocking coaching that nudges quality without friction.

**Applies to:** Human-facing submission channels only (Slack `/pip` command, any web UI). AI agents are coached via their system prompt integration template — not at submission time.

**UX pattern** (inherited and improved from OrgPhysics.AI):
- Coaching fires as the agent types, debounced 1.5 seconds after they stop
- Three visible states: `IDLE` → `ANALYZING` → `ALIGNED` (emerald) or `COACH TIP` (violet)
- Inline coaching suggestion appears below the input — never a blocking gate
- Agent can always submit regardless of coaching state

**Two-tier coaching architecture:**

| Tier | Method | Fires when | Purpose |
|---|---|---|---|
| 1 — Structural | Client-side heuristics (instant) | Always | Catches obvious failures: too short, single word, no specifics |
| 2 — Semantic | Claude API call (lightweight) | Only if Tier 1 passes | Evaluates clarity and specificity; returns one coaching nudge (≤ 15 words) or GOOD |

The Claude coaching prompt is intentionally minimal: *"Is this PIP specific enough to classify into an entropy category? If yes: GOOD. If no: one short coaching suggestion."* Single-sentence response, no streaming required.

**Example coaching nudges:**
- "Name the specific outcome that was blocked."
- "What broke down — the process, the information, or the decision?"
- "Describe the friction, not just the activity."

Low-quality PIPs that are submitted without refinement are stored normally but will surface with low classification confidence — flagged for admin review alongside other low-confidence items.

### The Two Map Views

| Noise | Signal |
|---|---|
| Every individual PIP plotted. Raw data. Shows the full distribution of friction across all 12 categories. | Category averages. Peaks emerge. Toggle the PSIU overlay to reveal which organizational force is deficient. |

### The 12 Entropy Categories

Each category maps to a PSIU quadrant. A score of 0 = no entropy (ideal). A score of 5 = high entropy (maximum friction). See [Appendix: Example PIPs by Category](#appendix-example-pips-by-category) for real-world examples.

#### Sales / Repeat Sales — P (Producing)
The most critical indicator for the sales function is repeat sales. Positive indicators show that repeat sales are increasing through recurring revenue, contract renewals, repeat purchases, contract expansions, or increasing usage. Negative indicators show that repeat sales aren't happening or they are declining. Look beyond single unit sales and find evidence that you're really solving the core customer need because they come back and buy or use more.

#### Brand Awareness / Market Clout — P (Producing)
Think of brand awareness and market clout as the level of influence that your brand exerts. A "0" indicates that your brand is well known and has a lot of positive influence to sway market dynamics. A "5" indicates that your brand has negative connotations or there is no market awareness and clout at all and this is harming sales and growth.

#### Quality / Efficiency — S (Stabilizing)
Can you consistently reproduce high-quality results without wasting time, money, or effort? A "0" indicates that your usual output is of very high caliber and if there's a breakdown in quality or scalability, you move quickly to identify and fix the root cause. A "5" indicates that you have poor quality, high waste, a lot of re-work or too many errors, or you're often creating temporary workarounds rather than fixing the root cause. Quality and efficiency must come together — one without the other means failure at scale.

#### Processes / Systems — S (Stabilizing)
Does the organization have processes and systems that work for it, or are you working for the processes and systems? A "0" indicates that you have efficient and effective processes and systems that support the work and those doing the work. A "5" indicates that you have cumbersome processes or systems, or a glaring gap in the need for good ones.

#### Metrics / Insight — I (Innovating)
Do you have clear, relevant, timely, and accurate metrics to support decision making? Can you glean insights through analysis? A "0" indicates that you're measuring what you need to measure on a regular, timely basis. A "5" indicates that you lack the data or can't access the data as you need it. You're flying blind.

#### Strategic Clarity / Priorities — I (Innovating)
It's not enough to choose a strategy — you have to sacrifice for that strategy and communicate it clearly to the entire ecosystem, including the management team, employees, investors, and partners. A "0" indicates that your strategy is clear, powerful, and well communicated. Everybody "gets it." A "5" indicates that the strategy and priorities are unclear or unbelievable. Nobody gets it or is buying into it.

#### Shared Vision / Values — U (Unifying)
Are the core vision and values defined and alive in your organization? Are they enforced and reinforced? And are they catalyzing a distinctive, high-performing organizational culture? A "0" indicates that you have a world-class organizational culture and that organizational leaders walk the talk. A "5" indicates that the core vision and values are unclear or are working against the organization's success.

#### Communications / Teamwork — U (Unifying)
How well is the team communicating? How well are they working together? A "0" indicates that you have world-class communication and teamwork. A "5" indicates that there's poor communication, misinformation, or mistrust.

#### Throughput / Production — P|S (Producing–Stabilizing border)
Does the organization produce results fast? A "0" indicates that you have extremely high output while working at a sustainable pace. A "5" indicates that you have poor throughput or the organization has to work at an unsustainable pace in order to meet expectations. In order to have fast throughput, it's not enough to simply work hard — the company must also systematize how it sells, services, and delivers.

#### Innovation / Disruption — P|I (Producing–Innovating border)
How disruptive or innovative is your business in the market? Are you finding and exploiting new market opportunities or following the herd? Are you proving the impossible possible? A "0" would indicate that you are being highly innovative or disruptive. A "5" would indicate that you are about to get crushed by a huge market shift for which you are unprepared. In order to have market-leading innovation, it's not enough to just have creative ideas — the company must bring those innovations to life by producing results.

#### Staff Recruiting / Retention — I|U (Innovating–Unifying border)
How well are you able to recruit the people you need to execute on your strategy? How well are you able to retain and develop your existing staff? A "0" indicates that you have your pick of top-notch talent and it's easy to keep them. A "5" indicates that you can't execute on the market demand because you can't hire or retain enough of the right kind of people. The greatest recruiting and retention tool is to be kicking butt on a high-growth strategy fused with a compelling culture.

#### Structure / Accountability — S|U (Stabilizing–Unifying border)
Does every facet of the organization have a person with accountability to ensure that goals are met? Is there an updated organizational structure that supports the chosen growth strategy? A "0" indicates that accountability is unarguably clear and the power centers of the organization are aligned with the strategy. A "5" indicates that there's unclear accountability and the organizational structure fights against the chosen strategy.

---

## Who Uses It

### Organization Admin
- Installs and configures the Entropy Map instance
- Creates teams and manages the team hierarchy
- Issues and manages API keys for agent integrations
- Reviews Claude classifications and applies overrides (reclassification)
- Manages agents (human and AI) registered in the system

*Full dashboard access. The only role that can reclassify PIPs or modify configuration.*

### Manager / Viewer
- Monitors the Entropy Map on a weekly or monthly cadence
- Reviews the Signal map and applies PSIU overlay to identify deficient forces
- Reads the pattern table to see where entropy is concentrating
- Drills down from patterns to constituent PIPs for context
- Uses AskLex advisor to understand what a pattern means and what to address first
- Escalates to OrgPhysics.AI for deeper strategic engagement when AskLex identifies it's warranted

*Read-only dashboard access. Cannot reclassify PIPs or modify configuration.*

### Agent (Human or AI)
Human and AI agents are treated identically by the system. Both authenticate via API key, submit to the same endpoint, and their PIPs are classified and weighted equally.

- Submits PIPs at the conclusion of tasks via the REST API (embedded in whatever system they work in)
- Responds to "What would improve your outcomes?" in natural language
- Optionally rates severity (1–5)
- Never needs to know the 12 categories or PSIU — Claude handles classification silently

*Authenticated via API key. POST /api/pips. No dashboard access by default.*

> **The key differentiator:** AI agents are first-class citizens. The Entropy Map captures friction that only the executing agent can see — unclear instructions, missing context, ambiguous scope — which no traditional feedback tool has ever done.

---

## How It Works

### PIP Submission Flow

```
Agent completes task
        |
        v
"What would improve your outcomes with this task?"
        |
        v
Agent responds in natural language:
"I need better strategic clarity before scoping this"
        |
        v  (optional)
"How much did this impact you? (1-5)"  -->  default: 3
        |
        v
POST /api/pips
{
  agent_id:         "claude-agent-12",
  agent_type:       "ai",
  task_description: "Write Q1 board summary",
  pip_text:         "I need better strategic clarity...",
  severity:         4,
  team_id:          "exec-team"
}
        |
        v
POST /api/pips returns 200 immediately
PIP stored in pips table (classified_at = null)
        |
        v
pg-boss enqueues classification job
        |
        v (worker process, async)
Claude classifies:
  category:    "Strategic Clarity / Priorities"
  quadrant:    I
  confidence:  0.91
  rationale:   "Agent explicitly states need for clarity..."
        |
        v
classified_at written back to pips table
        |
        +-->  Signal map updates on next load
```

### Integration Patterns

PIP capture must happen at the point of task completion, inside whatever system the agent already uses. There is no separate URL to visit. Integration = one HTTP POST, delivered via a pre-built template for the agent's environment.

| Pattern | Target | Description |
|---|---|---|
| **AI agent system prompt** | Claude Desktop, ChatGPT, custom LLM | Snippet added to CLAUDE.md or agent instructions. Agent asks the improvement question and POSTs the PIP automatically after each task. Zero friction for the human. |
| **Workflow automation node** | Gumloop, n8n, Make, Zapier | Pre-built HTTP POST node dropped at the end of any workflow. Configure once per workflow, fires automatically on completion. |
| **Task management webhook** | Jira, Asana, Linear, Notion | Webhook or automation rule triggers when a task moves to "Done." A lightweight form or prompt collects the PIP response inline. No separate tool to open. |
| **Slack / Teams slash command** | Slack, Microsoft Teams | `/pip [text]` slash command. Sends directly to the API. Works for humans completing tasks in chat-centric environments. |
| **curl / SDK call** | Any custom system | One curl command. Language-agnostic. Any system that can make an HTTP request can submit a PIP. Used for custom integrations not covered above. |

### Map Reading Flow

1. Open Signal map. Scan for elevated categories (high average severity).
2. Toggle PSIU overlay. Identify which organizational force (P/S/I/U) is deficient.
3. Read the pattern table. See which categories cross the threshold (3+ PIPs in window).
4. Click a pattern. Read the constituent PIPs. Understand the specific friction.
5. Ask AskLex — "What does this pattern mean and what should we address first?" Escalate to OrgPhysics.AI if deeper strategic engagement is needed.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AGENTS  (human or AI)                 │
│                                                          │
│  Claude Desktop │ Gumloop/n8n │ Jira/Asana │ Slack │ curl  │
└─────────────────────────┬───────────────────────────────┘
                          │  POST /api/pips
                          │  { task, pip_text, severity }
                          │  Authorization: Bearer {api_key}
                          ▼
┌─────────────────────────────────────────────────────────┐
│                ENTROPY MAP  (standalone app)             │
│                                                          │
│  ┌──────────────┐   ┌──────────────────┐   ┌──────────┐ │
│  │ PIP Ingest   │──►│ pg-boss Queue    │──►│ Database │ │
│  │ Endpoint     │   │ (PostgreSQL)     │   │ (6 tables│ │
│  └──────────────┘   └────────┬─────────┘   └──────────┘ │
│                              │                           │
│                     ┌────────▼─────────┐                 │
│                     │ Classification   │                 │
│                     │ Worker Process   │                 │
│                     │ (Claude API)     │                 │
│                     └──────────────────┘                 │
│  ┌──────────────────────────────────────────────────────┐│
│  │                  ADMIN DASHBOARD                     ││
│  │  Noise Map │ Signal Map + PSIU Toggle │ Pattern Table││
│  │  Timeline  │ Team Filter │ PIP Detail │ Reclassify   ││
│  │                                                      ││
│  │  ┌────────────────────────────────────────────────┐  ││
│  │  │  AskLex Advisor                                │  ││
│  │  │  Chat grounded in OP methodology + org data    │  ││
│  │  │  "Contact OrgPhysics.AI" │ "Upload Map" CTAs  │  ││
│  │  └────────────────────────────────────────────────┘  ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────┬────────────────────┘
                                      │  Human-initiated upload / CTA
                                      ▼
┌─────────────────────────────────────────────────────────┐
│                 ORGPHYSICS.AI  (consulting layer)        │
│  Strategic Engagement │ Expert Intervention Sequencing  │
│  Consulting │ PSIU Assessments │ Advanced Analysis       │
└─────────────────────────────────────────────────────────┘
```

| Component | Description |
|---|---|
| **Ingest Layer** | REST API endpoint. Authenticates via named API key (checked against `api_keys` table). Validates payload. Rate limited per api_key (leaky bucket). Queues for async classification via pg-boss. `POST /api/pips/bulk` accepts an array of PIPs for high-frequency AI workflows. |
| **Classification Engine** | pg-boss PostgreSQL job queue — no Redis required. Dedicated worker process in Docker Compose. Survives container restarts; jobs retry on failure. Worker calls Claude API, returns category, PSIU quadrant, confidence, rationale; writes back to `pips.classified_at`. |
| **Coaching Layer** | `/api/coach` endpoint. Rate limited per api_key/session. Client caches results by input text hash — repeated text never re-pings the API. |
| **Database** | 6 tables: organizations, api_keys, teams, agents, categories (seed data), pips. PostgreSQL. |
| **Dashboard** | React SPA. Noise + Signal map. Pattern table. Timeline controls. Team filter. Admin reclassification tools. |
| **AskLex Advisor** | Claude-powered chat in the admin dashboard. Context: current Signal map stats, top patterns, and top 5 PIPs by severity per elevated category (truncated to 200 chars each — max ~60 PIPs injected). System prompt grounded in Lex Sisney's OP methodology and intervention frameworks. Runs entirely within the org's instance — no data leaves. |

---

## Data Schema

### `organizations`
One row per installation.

| Field | Type | Note |
|---|---|---|
| id | uuid | Primary key |
| name | string | |
| slug | string | URL-safe identifier |
| created_at | timestamp | |

### `api_keys`
Multiple named keys per organization. Independent revocability — revoking the Slack key doesn't break the Jira webhook.

| Field | Type | Note |
|---|---|---|
| id | uuid | Primary key |
| org_id | uuid | FK organizations |
| name | string | Human-readable label, e.g. "Jira Webhook", "Slack Bot" |
| key_hash | string | SHA-256 of the key; plaintext never stored after creation |
| is_active | boolean | Revoke without deleting — audit trail preserved |
| created_at | timestamp | |
| last_used_at | timestamp | Rotation signal; null if never used |

### `teams`
Supports nested sub-teams. Heat map filterable by team.

| Field | Type | Note |
|---|---|---|
| id | uuid | |
| org_id | uuid | FK organizations |
| name | string | |
| parent_team_id | uuid? | Nullable — enables nesting |
| created_at | timestamp | |

### `agents`
Human or AI agents. `external_id` is the ID the submitting system uses.

| Field | Type | Note |
|---|---|---|
| id | uuid | |
| org_id | uuid | FK organizations |
| team_id | uuid? | Nullable |
| external_id | string | ID in the submitting system |
| agent_type | enum | human \| ai |
| name | string | Display name |
| created_at | timestamp | |

### `categories`
Seed data. 12 rows. Never changes at runtime.

| Field | Type | Note |
|---|---|---|
| id | int | |
| name | string | e.g. Strategic Clarity / Priorities |
| slug | string | e.g. strategic-clarity |
| psiu_quadrant | enum | P \| S \| I \| U \| P\|S \| P\|I \| I\|U \| S\|U |
| description | text | Education layer copy |
| display_order | int | Map position |

### `pips`
The atomic unit. `admin_category_id` takes precedence over `category_id` when set.

| Field | Type | Note |
|---|---|---|
| id | uuid | |
| org_id | uuid | FK organizations |
| team_id | uuid? | Nullable |
| agent_id | uuid | FK agents |
| task_description | text | Context of the task |
| pip_text | text | Raw natural language response |
| severity | int | 1–5, default 3 (optional at submission) |
| category_id | int | Claude's classification |
| classification_confidence | float | 0–1 |
| classification_rationale | text | Claude's reasoning |
| admin_category_id | int? | Override — takes precedence |
| status | enum | active \| archived \| spam |
| submitted_at | timestamp | |
| classified_at | timestamp | |

> **OrgPhysics.AI Export:** Every field OrgPhysics.AI needs for advanced analysis — `effective_category_id`, `psiu_quadrant` (join), `severity`, `submitted_at`, `agent_type`, `team_id`, `pip_text` — is present. Export format for the human-initiated upload is a flat join of these fields.

---

## Architectural Decisions

### ADR-01 — Standalone Web App
**Decision:** Self-hostable (Docker/Railway/Render), not a WordPress plugin or full SaaS.

**Rationale:** WordPress limits the agent integration surface. SaaS requires managing customer infra before proving value. A self-hostable app lets companies own their data, deploy in minutes, and integrate from any environment.

**Implications:** Company operates their own instance. Entropy Map team ships the software, not the infrastructure. Paid hosted tier is an optional add-on — not the primary model.

### ADR-02 — Universal REST API as Integration Layer
**Decision:** All PIP submissions go through a single POST endpoint authenticated by an API key.

**Rationale:** No single integration can control every agent environment. A REST API means any system — Claude Desktop, Gumloop, n8n, Jira webhooks, Slack slash commands, custom agents — can submit PIPs with a single HTTP call.

**Implications:** Integration = copy/paste a template, not a custom plugin per platform. Adoption friction is onboarding, not technical complexity.

### ADR-03 — Claude Classifies; Admin Can Override
**Decision:** Claude assigns every PIP to one of the 12 entropy categories. Admins can reclassify. Overrides take precedence permanently.

**Rationale:** Manual classification at submission time adds friction and requires agents to understand the OP taxonomy. Claude handles this invisibly. Admin oversight prevents drift and enables training data accumulation over time.

**Implications:** Classification quality depends on the Claude prompt and few-shot examples. The `admin_category_id` override field is the training signal — every correction improves future classification. Storing `classification_rationale` makes admin review fast.

### ADR-04 — Severity Score (1–5), Not Binary
**Decision:** Each PIP carries an optional severity rating (1–5, default 3). Signal map score = average severity per category.

**Rationale:** A minor annoyance and a task-blocking failure should not count equally. The 1–5 scale maps directly to the Organizational Physics Entropy Survey methodology — making Entropy Map readings comparable to a traditional survey.

**Implications:** Severity is optional to reduce submission friction. Default of 3 means every PIP still contributes to signal even if the agent skips the rating. Comparability with traditional Entropy Surveys is a key differentiator.

### ADR-05 — Two Map Views + PSIU Toggle
**Decision:** Noise view shows individual PIPs. Signal view shows category averages. PSIU quadrant overlay is a toggle on Signal — not a third view.

**Rationale:** Three discrete views adds cognitive overhead and navigation complexity. The PSIU overlay is a lens applied to the Signal map, not a destination. The toggle makes the framework earn its introduction progressively.

**Implications:** New users read Signal without needing to know PSIU. Keeps the UI surface area minimal for MVP.

### ADR-06 — Patterns Are Computed, Not Stored (MVP)
**Decision:** A pattern is a live query: categories with 3 or more PIPs in the selected time window, sorted by count/severity.

**Rationale:** Storing patterns requires curation UI, status management, and lifecycle tracking — all v2 complexity. Computed patterns are immediately useful without the overhead.

**Implications:** Pattern persistence (labels, assigned owner, status) is a v2 feature. The pattern table in MVP is read-only and dynamically generated.

### ADR-07 — AskLex In-App; OrgPhysics.AI as Human-Initiated Escalation
**Decision:** The Entropy Map is fully self-contained. AskLex — an AI advisor grounded in Lex Sisney's OP methodology — is embedded inside the app and answers synthesis questions using the org's own data. No data is automatically synced to OrgPhysics.AI. The OrgPhysics.AI relationship is two human-initiated CTAs: "Contact OrgPhysics.AI" and "Upload your Entropy Map for advanced analysis."

**Rationale:** Company PIP data is sensitive operational intelligence. Automatic sync to an external system creates a privacy barrier to adoption. AskLex delivers immediate advisory value inside the org's own instance. OrgPhysics.AI engagement is a warm, intentional escalation — managers who reach for it have already gotten value from AskLex and are raising their hand for more.

**Implications:** AskLex is the "what do I do about this?" layer, not OrgPhysics.AI. OrgPhysics.AI captures high-intent leads who want Lex directly. Schema includes an export format for the human-initiated upload path. Both products evolve independently — no tight coupling required.

---

## MVP Scope

*The smallest thing that proves core value: PIPs flow in, Claude classifies them, the map shows patterns, management reads signal.*

1. **REST API endpoint** — Authenticated PIP submission via named API key (checked against `api_keys` table). Validates payload. Rate limited per api_key (leaky bucket). Returns 200 immediately; classification is async. `POST /api/pips/bulk` accepts an array of PIPs in one call — intended for high-frequency AI workflows that batch at job completion rather than calling per micro-task.
2. **Claude classification** — Assigns category + PSIU quadrant. Stores confidence and rationale. Queued via pg-boss (PostgreSQL-native job queue — no Redis). A dedicated worker process in Docker Compose handles the queue; jobs survive container restarts and retry on failure. `classified_at` is null until the worker completes — dashboard queries filter accordingly.
3. **Admin dashboard** — Noise view + Signal view with PSIU overlay toggle. Timeline controls (day/week/month/quarter/year). Team filter.
4. **Pattern table** — Categories with 3+ PIPs in selected window, sorted by severity. Drill-down to constituent PIPs. Full PIP detail view.
5. **PIP quality coaching** — Real-time, non-blocking coaching on human-facing submission channels. Two-tier: client-side heuristics (instant) + Claude semantic check (fires only when heuristics pass). Shows ALIGNED or COACH TIP inline as the agent types. Never a gate — agent can always submit. Low-quality submissions surface as low-confidence classifications for admin review. Client caches results by input text hash — repeated or re-typed text never re-pings the API. `/api/coach` is rate limited per api_key/session to prevent runaway API spend.
6. **Admin reclassification** — Override Claude's category on any PIP. Stored as `admin_category_id`, takes precedence permanently.
7. **AskLex advisor** — AI advisor chat embedded in the admin dashboard. Context: current Signal map stats, top patterns, and top 5 PIPs by severity per elevated category (each truncated to 200 chars). Deterministic truncation — no vector search in MVP; maximum ~60 PIPs injected regardless of data volume. System prompt grounded in Lex Sisney's OP methodology and intervention frameworks (books, training material, sequencing principles). Answers "What should we focus on?" and "What does this pattern mean for our organization?" Data stays in-instance — nothing leaves. V2: semantic retrieval (per-question vector search) for more precise context selection.
8. **OrgPhysics.AI handoff CTAs** — "Contact OrgPhysics.AI" and "Upload your Entropy Map for advanced analysis" — surfaced in the dashboard when AskLex identifies patterns that warrant deeper engagement.
9. **Integration templates** — Claude Desktop system prompt snippet. n8n/Make/Gumloop HTTP node config. Jira/Asana webhook guide. Slack slash command. curl example. AI agent system prompt includes PIP quality guidance so coaching happens before submission.

**Out of scope for MVP:**
- Persistent pattern storage, labels, or ownership → v2
- Fine-tuning Claude classifier on admin overrides → v2
- Benchmarking across organizations → not planned (entropy is too contextual)
- Mobile app

---

## Business Model

The full SaaS model failed to generate traction. The open-source model inverts the unit economics: community adoption first, monetization through what the data surfaces.

| Tier | Model | Description |
|---|---|---|
| **Open-Source Core** | Free | Self-hostable. Full PIP capture, classification, visualization, and AskLex advisor. Community installs it, word spreads, and the OP Entropy Survey methodology becomes the standard. |
| **Hosted Tier** | $/mo | No DevOps. One-click deploy via Railway. Entropy Map team manages infrastructure. For companies that want the value without the setup. |
| **OrgPhysics.AI** | Project-based | The expert layer. Triggered when AskLex surfaces a pattern and the manager wants Lex himself. They've already seen their map, already gotten advice — they're raising their hand for a strategic engagement. The app is the lead generation mechanism. |
| **Consulting** | Project-based | The Entropy Map makes the consulting engagement obvious before the first call. The data is already there. Lex shows up knowing exactly where the entropy is concentrated. |

> **The moat:** Nobody else's classification system maps to PSIU. Nobody else has Lex Sisney's 15+ years of intervention frameworks to ground an advisor. The open-source layer distributes the methodology. AskLex delivers immediate value. OrgPhysics.AI captures the clients who want more.

---

## Open Decisions

### ~~Tech Stack~~ — DECIDED: Next.js/TypeScript
Aligns with OrgPhysics.AI stack. Enables shared TypeScript schema types and shared Claude API integration patterns across both products.

### ~~Deploy Model~~ — DECIDED: Docker Compose + Railway
Docker Compose is the primary self-host path — one command, full data ownership, works on any infra. Railway is the one-click hosted path for teams that want to try it without DevOps. Both are shipped; they serve different audiences. Vercel + Supabase ruled out because the async classification worker requires a persistent process.

### ~~Claude Classification Prompt~~ — DECIDED: Approach locked, prompt written at build time

**Approach:**
- System prompt includes all 12 category definitions + 36 few-shot examples (3 per category, sourced from the appendix)
- **Tiebreaker rule:** When a PIP fits two categories, classify to the *source* of the problem, not the symptom (e.g., "I couldn't prioritize because my manager's goals conflict" → Strategic Clarity, not Communications)
- **Output:** Structured JSON — `{ category, psiu_quadrant, confidence, rationale }`
- **Low-confidence flagging:** If confidence < 0.6, flag for admin review rather than forcing a weak classification
- Highest-value engineering task in the MVP — write and iterate before wiring to the API

### ~~Repo Ownership~~ — DECIDED: `github.com/Organizational-Physics/entropy-map`
Public repo under the Organizational-Physics org. Reinforces that this is the canonical open-source tool from the inventors of the methodology, not a personal project.

### ~~OrgPhysics.AI Sync Protocol~~ — DECIDED: No automatic sync. AskLex in-app. Human-mediated handoff.

- **No automatic sync.** Company data never leaves their instance. Benchmarking across organizations is not valuable — entropy is highly contextual to each company.
- **AskLex** — An AI advisor embedded directly inside the Entropy Map admin dashboard. Has full access to that org's patterns, scores, and PIPs because it runs inside their instance. Grounded in Lex Sisney's OP methodology and intervention frameworks. Answers "What should we focus on?" and "What does this pattern mean?" without any data leaving the environment.
- **OrgPhysics.AI handoff** — Two CTAs in the dashboard: "Contact OrgPhysics.AI" (links to consulting engagement) and "Upload your Entropy Map to OrgPhysics.AI for advanced analysis" (human-initiated, intentional export). This is a warm lead — the manager has already gotten value from AskLex and is raising their hand for more.

---

## Appendix: Example PIPs by Category

These examples show what real PIP submissions look like — brief, natural-language friction notes captured at task completion. Examples are drawn and adapted from real Organizational Physics Entropy Survey responses.

### Sales / Repeat Sales
- "I had no visibility into this customer's purchase history. Knowing renewal likelihood upfront would have let me prioritize the conversation differently."
- "We measure time to first close, but the more telling metric is time to repeat purchase. We're optimizing for the wrong thing."
- "There's no process for understanding why a customer didn't come back. We lose the signal every time."

### Brand Awareness / Market Clout
- "A prospect mentioned they hadn't heard of us before the referral. There's a gap between what we do and our visibility in this market segment."
- "Three candidates declined to move forward because they hadn't heard of us. Our employer brand isn't landing."
- "Our sub-brands are invisible externally. Customers don't know they're part of the same company."

### Quality / Efficiency
- "I had to redo this deliverable because the quality standard wasn't documented anywhere. The rework added half a day."
- "The workaround I'm using for this process adds 2 hours per instance. We need to fix the root cause."
- "Information is scattered across three tools. Poor data quality caused an error that took a day to trace."

### Processes / Systems
- "I had to pull data from four different systems to complete this task. A unified data source would have cut the time in half."
- "The approval process required five handoffs for a low-stakes decision. We need a tiered authorization model."
- "Most new systems are being built in silos. My main concern is how it all ties together at the org level."

### Metrics / Insight
- "I couldn't answer whether this initiative is on track because we have no real-time dashboard for this metric."
- "I'm tracking the wrong KPI for this goal. The number goes up but the outcome hasn't improved."
- "We don't know how we compare to competitors. We're making strategic calls without external benchmarks."

### Strategic Clarity / Priorities
- "I wasn't sure whether to prioritize this task or the competing request from another team. There's no ranked list of Q3 priorities."
- "I spent time on this project only to learn it was deprioritized two weeks ago. The strategy change wasn't communicated to my team."
- "Short-term goals need clearer definitions. I'm not sure what success looks like for this quarter."

### Shared Vision / Values
- "A new team member asked me what our values actually mean for day-to-day decisions. I couldn't give a concrete answer."
- "I made a decision based on what I thought we stood for, but it turned out to contradict how leadership handles this situation."
- "The vision is clear at the senior team level, but it doesn't seem to filter down past middle management."

### Communications / Teamwork
- "I completed my part of this deliverable without knowing the downstream team had already started on the same problem. No coordination."
- "The information I needed existed but was never shared with my team. I wasted half a day rediscovering it."
- "Rapid growth has created communication breakdowns. Teams are making decisions in parallel that conflict."

### Throughput / Production
- "This task required sign-off from three layers of management. By the time approval came, the window had passed."
- "The bottleneck is always the same two people. We need to either scale their capacity or delegate their approvals."
- "We have to throw an enormous amount of time and effort at permit approvals. There has to be a better process."

### Innovation / Disruption
- "A competitor launched a feature we've had on the roadmap for 18 months but never shipped. We need a faster path from idea to market."
- "I proposed an approach that would have saved 30% of the time but it was rejected because it deviated from the standard process."
- "We're missing an opportunity to lead into a new market category. We keep deferring because there's no immediate ROI, but the strategic risk is real."

### Staff Recruiting / Retention
- "I had to do this task myself because the role that should own it has been open for four months."
- "A key team member left mid-project. The institutional knowledge walked out with them — no documentation, no transition."
- "Retention is a problem in this function. High turnover means we're constantly retraining instead of advancing."

### Structure / Accountability
- "Two teams both think they own this decision. It took three meetings to resolve who had the authority to act."
- "This goal has no clear owner. I don't know who to escalate to when it's falling behind."
- "Goals and KPIs haven't been cascaded to my level. I'm not sure how my work connects to the strategic objectives."
