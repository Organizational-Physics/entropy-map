"use client";

import { useEffect, useState, useCallback } from "react";
import SignalMap from "@/components/SignalMap";
import NoiseMap from "@/components/NoiseMap";
import PatternTable from "@/components/PatternTable";
import AskLex from "@/components/AskLex";

export type TimeWindow = "1d" | "7d" | "30d" | "90d" | "1y";

export interface SignalEntry {
  category_id: number;
  category_name: string;
  psiu_quadrant: string;
  avg_severity: number;
  pip_count: number;
}

export interface Pip {
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
}

export interface DashboardData {
  org: { id: string; name: string };
  signal: SignalEntry[];
  patterns: SignalEntry[];
  pips: Pip[];
  teams: Array<{ id: string; name: string }>;
  stats: {
    total_pips: number;
    classified_pips: number;
    active_categories: number;
    top_category: string | null;
    top_category_score: number | null;
    window: string;
  };
}

type ViewMode = "signal" | "noise";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("signal");
  const [window, setWindow] = useState<TimeWindow>("30d");
  const [teamId, setTeamId] = useState<string>("");
  const [psiuOverlay, setPsiuOverlay] = useState(false);
  const [selectedPip, setSelectedPip] = useState<Pip | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ window });
      if (teamId) params.set("team", teamId);
      const res = await fetch(`/api/dashboard?${params}`);
      if (!res.ok) throw new Error("Failed to load dashboard");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [window, teamId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const windowLabels: Record<TimeWindow, string> = {
    "1d": "24h", "7d": "7d", "30d": "30d", "90d": "90d", "1y": "1y"
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-orange-500 flex items-center justify-center text-sm font-bold text-white">E</div>
          <div>
            <h1 className="text-base font-semibold text-white">Entropy Map</h1>
            <p className="text-xs text-gray-500">{data?.org?.name || "Loading…"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Time window */}
          <div className="flex bg-gray-900 rounded-lg p-0.5 border border-gray-800">
            {(["1d", "7d", "30d", "90d", "1y"] as TimeWindow[]).map((w) => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  window === w
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {windowLabels[w]}
              </button>
            ))}
          </div>

          {/* Team filter */}
          {data && data.teams.length > 0 && (
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-gray-300 text-xs rounded-lg px-3 py-1.5"
            >
              <option value="">All teams</option>
              {data.teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={fetchData}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1.5"
            title="Refresh"
          >
            ↻
          </button>
        </div>
      </header>

      {/* Stats bar */}
      {data && (
        <div className="border-b border-gray-800 px-6 py-3 flex items-center gap-8">
          <StatPill label="Total PIPs" value={data.stats.total_pips} />
          <StatPill label="Classified" value={`${data.stats.classified_pips} / ${data.stats.total_pips}`} />
          <StatPill label="Active Categories" value={data.stats.active_categories} />
          {data.stats.top_category && (
            <StatPill
              label="Highest Entropy"
              value={`${data.stats.top_category} (${data.stats.top_category_score?.toFixed(1)}/5)`}
              highlight
            />
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* View toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex bg-gray-900 rounded-lg p-0.5 border border-gray-800">
              <button
                onClick={() => setView("signal")}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  view === "signal"
                    ? "bg-gray-700 text-white font-medium"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Signal Map
              </button>
              <button
                onClick={() => setView("noise")}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  view === "noise"
                    ? "bg-gray-700 text-white font-medium"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Noise Map
              </button>
            </div>

            {view === "signal" && (
              <button
                onClick={() => setPsiuOverlay(!psiuOverlay)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  psiuOverlay
                    ? "bg-indigo-900 border-indigo-700 text-indigo-300"
                    : "border-gray-700 text-gray-400 hover:text-gray-200"
                }`}
              >
                PSIU Overlay {psiuOverlay ? "ON" : "OFF"}
              </button>
            )}
          </div>

          {loading && !data && (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Loading…
            </div>
          )}

          {error && (
            <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg p-4 text-sm">
              {error}
            </div>
          )}

          {data && view === "signal" && (
            <>
              <SignalMap
                signal={data.signal}
                psiuOverlay={psiuOverlay}
                onCategoryClick={(catId) => {
                  setView("noise");
                }}
              />
              <PatternTable patterns={data.patterns} pips={data.pips} />
            </>
          )}

          {data && view === "noise" && (
            <NoiseMap
              pips={data.pips}
              onPipClick={setSelectedPip}
            />
          )}
        </main>

        {/* AskLex sidebar */}
        <aside className="w-96 border-l border-gray-800 flex flex-col overflow-hidden">
          <AskLex />
        </aside>
      </div>

      {/* PIP detail modal */}
      {selectedPip && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPip(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={selectedPip.severity} />
                {selectedPip.category_name && (
                  <PsiuBadge quadrant={selectedPip.psiu_quadrant || ""} label={selectedPip.category_name} />
                )}
              </div>
              <button onClick={() => setSelectedPip(null)} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
            </div>
            <p className="text-gray-100 text-sm leading-relaxed mb-4">{selectedPip.pip_text}</p>
            {selectedPip.classification_rationale && (
              <p className="text-xs text-gray-500 italic border-t border-gray-800 pt-3">
                {selectedPip.classification_rationale}
              </p>
            )}
            <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
              <span>{selectedPip.agent_name}</span>
              <span>·</span>
              <span>{selectedPip.agent_type === "ai" ? "🤖 AI" : "👤 Human"}</span>
              {selectedPip.team_name && <><span>·</span><span>{selectedPip.team_name}</span></>}
              <span>·</span>
              <span>{new Date(selectedPip.submitted_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-sm font-semibold ${highlight ? "text-orange-400" : "text-gray-100"}`}>{value}</div>
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: number }) {
  const colors = ["", "bg-green-900 text-green-300", "bg-green-900 text-green-300", "bg-yellow-900 text-yellow-300", "bg-orange-900 text-orange-300", "bg-red-900 text-red-300"];
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[severity]}`}>
      {severity}/5
    </span>
  );
}

export function PsiuBadge({ quadrant, label }: { quadrant: string; label: string }) {
  const colors: Record<string, string> = {
    P: "bg-orange-950 text-orange-300 border-orange-800",
    S: "bg-blue-950 text-blue-300 border-blue-800",
    I: "bg-purple-950 text-purple-300 border-purple-800",
    U: "bg-green-950 text-green-300 border-green-800",
    PS: "bg-amber-950 text-amber-300 border-amber-800",
    PI: "bg-rose-950 text-rose-300 border-rose-800",
    IU: "bg-teal-950 text-teal-300 border-teal-800",
    SU: "bg-cyan-950 text-cyan-300 border-cyan-800",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[quadrant] || "bg-gray-800 text-gray-300 border-gray-700"}`}>
      {label}
    </span>
  );
}
