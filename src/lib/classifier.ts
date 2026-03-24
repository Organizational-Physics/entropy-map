import Anthropic from "@anthropic-ai/sdk";

// Lazy-init so env vars are available at call time, not module load time
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

const SYSTEM_PROMPT = `You are an expert classifier for the Organizational Physics Entropy Survey methodology. Your job is to classify a PIP (Potential Improvement Point) into exactly one of the 12 entropy categories below.

## The 12 Entropy Categories

**Sales / Repeat Sales** (PSIU: P — Producing)
The most critical indicator for the sales function is repeat sales. Look for friction around customer retention, renewals, repeat purchases, and whether the team is truly solving core customer needs.

**Brand Awareness / Market Clout** (PSIU: P — Producing)
Friction around brand recognition, market influence, employer brand, and the organization's ability to sway market dynamics positively.

**Quality / Efficiency** (PSIU: S — Stabilizing)
Friction around consistent high-quality output, rework, waste, workarounds, errors, and the inability to reproduce results without excessive effort.

**Processes / Systems** (PSIU: S — Stabilizing)
Friction caused by cumbersome, missing, or ineffective processes and systems. The organization works for the systems rather than the systems working for it.

**Metrics / Insight** (PSIU: I — Innovating)
Friction around having clear, relevant, timely, and accurate data for decision-making. Flying blind. Poor dashboards, missing KPIs, lack of benchmarks.

**Strategic Clarity / Priorities** (PSIU: I — Innovating)
Friction caused by unclear strategy, conflicting priorities, poor strategic communication, or nobody understanding or believing in the direction.

**Shared Vision / Values** (PSIU: U — Unifying)
Friction caused by unclear or unenforced values, disconnected organizational culture, leadership not walking the talk, or vision not filtering to all levels.

**Communications / Teamwork** (PSIU: U — Unifying)
Friction caused by poor communication, coordination failures, misinformation, siloed teams, or work being duplicated or conflicting across teams.

**Throughput / Production** (PSIU: P|S — Producing-Stabilizing border)
Friction around output speed and sustainable pace. Bottlenecks, approval chains, capacity constraints that slow results.

**Innovation / Disruption** (PSIU: P|I — Producing-Innovating border)
Friction around the organization's ability to innovate, bring new ideas to market, and adapt to market shifts before they become threats.

**Staff Recruiting / Retention** (PSIU: I|U — Innovating-Unifying border)
Friction caused by inability to attract or keep the right talent, open roles blocking execution, knowledge walking out the door.

**Structure / Accountability** (PSIU: S|U — Stabilizing-Unifying border)
Friction caused by unclear ownership, ambiguous accountability, organizational structure fighting the strategy, or goals not cascading clearly.

## Classification Rules

1. **Classify to the source, not the symptom.** Example: "I couldn't prioritize because my manager's goals conflict" → Strategic Clarity / Priorities (the source), not Communications / Teamwork (the symptom).
2. **Choose exactly one category.** Pick the best fit — the one that addresses the root cause.
3. **Low confidence means the PIP is ambiguous** — flag it honestly rather than forcing a weak classification.

## Output Format

Respond with ONLY valid JSON, no markdown, no explanation:
{
  "category": "<exact category name from the list above>",
  "psiu_quadrant": "<P|S|I|U|PS|PI|IU|SU>",
  "confidence": <float 0.0-1.0>,
  "rationale": "<one sentence explaining why this category>"
}`;

const FEW_SHOT_EXAMPLES = [
  // Sales / Repeat Sales
  {
    input: "I had no visibility into this customer's purchase history. Knowing renewal likelihood upfront would have let me prioritize the conversation differently.",
    output: { category: "Sales / Repeat Sales", psiu_quadrant: "P", confidence: 0.92, rationale: "Directly about tracking and acting on repeat purchase signals and renewal likelihood." }
  },
  {
    input: "We measure time to first close, but the more telling metric is time to repeat purchase. We're optimizing for the wrong thing.",
    output: { category: "Sales / Repeat Sales", psiu_quadrant: "P", confidence: 0.88, rationale: "The friction is about measuring and improving repeat sales, the core health indicator of the sales function." }
  },
  // Brand Awareness / Market Clout
  {
    input: "A prospect mentioned they hadn't heard of us before the referral. There's a gap between what we do and our visibility in this market segment.",
    output: { category: "Brand Awareness / Market Clout", psiu_quadrant: "P", confidence: 0.91, rationale: "Low brand recognition in a target market segment is a direct brand awareness gap." }
  },
  {
    input: "Three candidates declined to move forward because they hadn't heard of us. Our employer brand isn't landing.",
    output: { category: "Brand Awareness / Market Clout", psiu_quadrant: "P", confidence: 0.85, rationale: "Employer brand weakness is causing recruiting friction — the root is brand clout, not recruiting process." }
  },
  // Quality / Efficiency
  {
    input: "I had to redo this deliverable because the quality standard wasn't documented anywhere. The rework added half a day.",
    output: { category: "Quality / Efficiency", psiu_quadrant: "S", confidence: 0.93, rationale: "Undocumented quality standards leading to rework is a quality and efficiency failure." }
  },
  {
    input: "Information is scattered across three tools. Poor data quality caused an error that took a day to trace.",
    output: { category: "Quality / Efficiency", psiu_quadrant: "S", confidence: 0.82, rationale: "Data quality issues causing errors and rework — the root is quality, even though systems are involved." }
  },
  // Processes / Systems
  {
    input: "I had to pull data from four different systems to complete this task. A unified data source would have cut the time in half.",
    output: { category: "Processes / Systems", psiu_quadrant: "S", confidence: 0.90, rationale: "Fragmented systems creating unnecessary process overhead is a Processes / Systems failure." }
  },
  {
    input: "The approval process required five handoffs for a low-stakes decision. We need a tiered authorization model.",
    output: { category: "Processes / Systems", psiu_quadrant: "S", confidence: 0.88, rationale: "An overly complex approval process is a direct process design failure." }
  },
  // Metrics / Insight
  {
    input: "I couldn't answer whether this initiative is on track because we have no real-time dashboard for this metric.",
    output: { category: "Metrics / Insight", psiu_quadrant: "I", confidence: 0.95, rationale: "Missing real-time metric visibility prevents decision-making — a classic Metrics / Insight gap." }
  },
  {
    input: "We don't know how we compare to competitors. We're making strategic calls without external benchmarks.",
    output: { category: "Metrics / Insight", psiu_quadrant: "I", confidence: 0.87, rationale: "Lack of competitive benchmarks is a data and insight gap affecting strategic decisions." }
  },
  // Strategic Clarity / Priorities
  {
    input: "I wasn't sure whether to prioritize this task or the competing request from another team. There's no ranked list of Q3 priorities.",
    output: { category: "Strategic Clarity / Priorities", psiu_quadrant: "I", confidence: 0.92, rationale: "Inability to prioritize due to missing clarity on strategic priorities is the defining symptom of this category." }
  },
  {
    input: "I spent time on this project only to learn it was deprioritized two weeks ago. The strategy change wasn't communicated to my team.",
    output: { category: "Strategic Clarity / Priorities", psiu_quadrant: "I", confidence: 0.89, rationale: "Strategy changed but wasn't communicated — the source is strategic clarity and communication, not teamwork." }
  },
  // Shared Vision / Values
  {
    input: "A new team member asked me what our values actually mean for day-to-day decisions. I couldn't give a concrete answer.",
    output: { category: "Shared Vision / Values", psiu_quadrant: "U", confidence: 0.91, rationale: "Values not translated into actionable guidance signals a Shared Vision / Values gap." }
  },
  {
    input: "The vision is clear at the senior team level, but it doesn't seem to filter down past middle management.",
    output: { category: "Shared Vision / Values", psiu_quadrant: "U", confidence: 0.88, rationale: "Vision not cascading through the organization is a Shared Vision / Values failure." }
  },
  // Communications / Teamwork
  {
    input: "I completed my part of this deliverable without knowing the downstream team had already started on the same problem. No coordination.",
    output: { category: "Communications / Teamwork", psiu_quadrant: "U", confidence: 0.93, rationale: "Duplicate work due to lack of cross-team coordination is a Communications / Teamwork failure." }
  },
  {
    input: "The information I needed existed but was never shared with my team. I wasted half a day rediscovering it.",
    output: { category: "Communications / Teamwork", psiu_quadrant: "U", confidence: 0.90, rationale: "Information hoarding or siloing causing redundant work is a communications failure." }
  },
  // Throughput / Production
  {
    input: "This task required sign-off from three layers of management. By the time approval came, the window had passed.",
    output: { category: "Throughput / Production", psiu_quadrant: "PS", confidence: 0.89, rationale: "Approval chain bottlenecks causing missed opportunities is a Throughput / Production failure." }
  },
  {
    input: "The bottleneck is always the same two people. We need to either scale their capacity or delegate their approvals.",
    output: { category: "Throughput / Production", psiu_quadrant: "PS", confidence: 0.91, rationale: "Persistent human bottlenecks limiting throughput is the defining pattern of this category." }
  },
  // Innovation / Disruption
  {
    input: "A competitor launched a feature we've had on the roadmap for 18 months but never shipped. We need a faster path from idea to market.",
    output: { category: "Innovation / Disruption", psiu_quadrant: "PI", confidence: 0.92, rationale: "Failure to ship innovations before competitors is a direct Innovation / Disruption failure." }
  },
  {
    input: "We're missing an opportunity to lead into a new market category. We keep deferring because there's no immediate ROI, but the strategic risk is real.",
    output: { category: "Innovation / Disruption", psiu_quadrant: "PI", confidence: 0.88, rationale: "Inability to act on market disruption signals is an Innovation / Disruption gap." }
  },
  // Staff Recruiting / Retention
  {
    input: "I had to do this task myself because the role that should own it has been open for four months.",
    output: { category: "Staff Recruiting / Retention", psiu_quadrant: "IU", confidence: 0.94, rationale: "Open roles blocking execution is a direct recruiting gap." }
  },
  {
    input: "A key team member left mid-project. The institutional knowledge walked out with them — no documentation, no transition.",
    output: { category: "Staff Recruiting / Retention", psiu_quadrant: "IU", confidence: 0.90, rationale: "Knowledge loss through unplanned attrition is a retention failure." }
  },
  // Structure / Accountability
  {
    input: "Two teams both think they own this decision. It took three meetings to resolve who had the authority to act.",
    output: { category: "Structure / Accountability", psiu_quadrant: "SU", confidence: 0.95, rationale: "Overlapping ownership causing decision paralysis is the defining symptom of Structure / Accountability gaps." }
  },
  {
    input: "This goal has no clear owner. I don't know who to escalate to when it's falling behind.",
    output: { category: "Structure / Accountability", psiu_quadrant: "SU", confidence: 0.93, rationale: "Goals without owners is a direct accountability structure failure." }
  },
];

export interface ClassificationResult {
  category: string;
  psiu_quadrant: string;
  confidence: number;
  rationale: string;
  category_id?: number;
}

const CATEGORY_IDS: Record<string, number> = {
  "Sales / Repeat Sales": 1,
  "Brand Awareness / Market Clout": 2,
  "Quality / Efficiency": 3,
  "Processes / Systems": 4,
  "Metrics / Insight": 5,
  "Strategic Clarity / Priorities": 6,
  "Shared Vision / Values": 7,
  "Communications / Teamwork": 8,
  "Throughput / Production": 9,
  "Innovation / Disruption": 10,
  "Staff Recruiting / Retention": 11,
  "Structure / Accountability": 12,
};

export async function classifyPip(
  pipText: string,
  taskDescription?: string
): Promise<ClassificationResult> {
  const userContent = taskDescription
    ? `Task context: ${taskDescription}\n\nPIP: ${pipText}`
    : `PIP: ${pipText}`;

  // Build few-shot examples as conversation turns
  const messages: Anthropic.MessageParam[] = [];
  for (const ex of FEW_SHOT_EXAMPLES.slice(0, 12)) {
    messages.push({ role: "user", content: ex.input });
    messages.push({ role: "assistant", content: JSON.stringify(ex.output) });
  }
  messages.push({ role: "user", content: userContent });

  const response = await getClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const result = JSON.parse(text) as ClassificationResult;
    result.category_id = CATEGORY_IDS[result.category];
    return result;
  } catch {
    // Fallback if JSON parsing fails
    return {
      category: "Strategic Clarity / Priorities",
      psiu_quadrant: "I",
      confidence: 0.1,
      rationale: "Classification failed — flagged for admin review.",
      category_id: 6,
    };
  }
}

export async function coachPip(pipText: string): Promise<string | null> {
  if (pipText.length < 10) return "Describe the specific friction you experienced.";
  if (pipText.split(" ").length < 5) return "Add more context — what broke down and how did it affect your work?";

  const response = await getClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 64,
    messages: [
      {
        role: "user",
        content: `Is this PIP specific enough to classify into an operational friction category? PIP: "${pipText}"

If yes, respond with exactly: GOOD
If no, respond with one coaching suggestion of 15 words or fewer. No preamble.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text.trim() : "GOOD";
  return text === "GOOD" ? null : text;
}
