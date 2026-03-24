"use client";

import { SignalEntry } from "@/app/dashboard/page";

const PSIU_COLORS: Record<string, { bar: string; bg: string; label: string }> = {
  P:  { bar: "bg-orange-500", bg: "bg-orange-950/30", label: "P" },
  S:  { bar: "bg-blue-500",   bg: "bg-blue-950/30",   label: "S" },
  I:  { bar: "bg-purple-500", bg: "bg-purple-950/30", label: "I" },
  U:  { bar: "bg-green-500",  bg: "bg-green-950/30",  label: "U" },
  PS: { bar: "bg-amber-500",  bg: "bg-amber-950/30",  label: "P|S" },
  PI: { bar: "bg-rose-500",   bg: "bg-rose-950/30",   label: "P|I" },
  IU: { bar: "bg-teal-500",   bg: "bg-teal-950/30",   label: "I|U" },
  SU: { bar: "bg-cyan-500",   bg: "bg-cyan-950/30",   label: "S|U" },
};

interface Props {
  signal: SignalEntry[];
  psiuOverlay: boolean;
  onCategoryClick: (categoryId: number) => void;
}

export default function SignalMap({ signal, psiuOverlay, onCategoryClick }: Props) {
  if (signal.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500 mb-6">
        No classified PIPs yet — submit your first PIP via the API to see the signal map.
      </div>
    );
  }

  // If PSIU overlay: group by quadrant
  const grouped = psiuOverlay
    ? groupByPsiu(signal)
    : { "All": signal };

  const psiuGroups = psiuOverlay
    ? ["P", "S", "I", "U", "PS", "PI", "IU", "SU"].filter((q) => grouped[q]?.length > 0)
    : ["All"];

  const psiuNames: Record<string, string> = {
    P: "Producing", S: "Stabilizing", I: "Innovating", U: "Unifying",
    PS: "Producing–Stabilizing", PI: "Producing–Innovating",
    IU: "Innovating–Unifying", SU: "Stabilizing–Unifying",
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-300">Signal Map</h2>
        <span className="text-xs text-gray-500">0 = no friction · 5 = maximum friction</span>
      </div>

      {psiuGroups.map((groupKey) => {
        const entries = grouped[groupKey] || [];
        const colors = PSIU_COLORS[groupKey] || PSIU_COLORS.P;

        return (
          <div key={groupKey} className="mb-4">
            {psiuOverlay && (
              <div className={`flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg ${colors.bg} inline-flex`}>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors.bar} text-white`}>{colors.label}</span>
                <span className="text-xs text-gray-300 font-medium">{psiuNames[groupKey]}</span>
              </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {entries.map((entry, i) => (
                <CategoryRow
                  key={entry.category_id}
                  entry={entry}
                  isLast={i === entries.length - 1}
                  onClick={() => onCategoryClick(entry.category_id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoryRow({
  entry,
  isLast,
  onClick,
}: {
  entry: SignalEntry;
  isLast: boolean;
  onClick: () => void;
}) {
  const colors = PSIU_COLORS[entry.psiu_quadrant] || PSIU_COLORS.P;
  const pct = (entry.avg_severity / 5) * 100;
  const isHigh = entry.avg_severity >= 4;
  const isMid = entry.avg_severity >= 3 && entry.avg_severity < 4;

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-800/50 transition-colors ${
        !isLast ? "border-b border-gray-800" : ""
      }`}
      onClick={onClick}
    >
      {/* Category name */}
      <div className="w-52 flex-shrink-0">
        <span className="text-sm text-gray-200">{entry.category_name}</span>
      </div>

      {/* Bar */}
      <div className="flex-1 flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bar} ${
              isHigh ? "opacity-100" : isMid ? "opacity-80" : "opacity-60"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-sm font-mono font-semibold w-8 text-right ${
          isHigh ? "text-red-400" : isMid ? "text-orange-400" : "text-gray-400"
        }`}>
          {entry.avg_severity.toFixed(1)}
        </span>
      </div>

      {/* PIP count */}
      <div className="w-16 text-right">
        <span className="text-xs text-gray-500">{entry.pip_count} PIP{entry.pip_count !== 1 ? "s" : ""}</span>
      </div>

      {/* PSIU tag */}
      <div className="w-8 text-right">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors.bar} text-white`}>
          {entry.psiu_quadrant}
        </span>
      </div>
    </div>
  );
}

function groupByPsiu(signal: SignalEntry[]): Record<string, SignalEntry[]> {
  const groups: Record<string, SignalEntry[]> = {};
  for (const entry of signal) {
    const q = entry.psiu_quadrant;
    if (!groups[q]) groups[q] = [];
    groups[q].push(entry);
  }
  return groups;
}
