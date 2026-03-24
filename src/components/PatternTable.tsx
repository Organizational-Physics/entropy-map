"use client";

import { useState } from "react";
import { SignalEntry, Pip } from "@/app/dashboard/page";
import { SeverityBadge } from "@/app/dashboard/page";

const PSIU_COLORS: Record<string, string> = {
  P: "text-orange-400", S: "text-blue-400", I: "text-purple-400", U: "text-green-400",
  PS: "text-amber-400", PI: "text-rose-400", IU: "text-teal-400", SU: "text-cyan-400",
};

interface Props {
  patterns: SignalEntry[];
  pips: Pip[];
}

export default function PatternTable({ patterns, pips }: Props) {
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  if (patterns.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center text-gray-500 text-sm mb-6">
        No patterns yet — a pattern requires 3+ PIPs in the same category.
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-300 mb-4">Patterns</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {patterns.map((pattern, i) => {
          const isExpanded = expandedCategory === pattern.category_id;
          const relatedPips = pips.filter(
            (p) => p.category_name === pattern.category_name
          );

          return (
            <div key={pattern.category_id} className={i !== patterns.length - 1 ? "border-b border-gray-800" : ""}>
              <div
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => setExpandedCategory(isExpanded ? null : pattern.category_id)}
              >
                <div className="flex-1">
                  <span className="text-sm text-gray-200">{pattern.category_name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold ${PSIU_COLORS[pattern.psiu_quadrant]}`}>
                    {pattern.psiu_quadrant}
                  </span>
                  <span className="text-xs text-gray-500">{pattern.pip_count} PIPs</span>
                  <span className="text-sm font-mono font-semibold text-orange-400">
                    {pattern.avg_severity.toFixed(1)}/5
                  </span>
                  <span className="text-gray-600 text-sm">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-800 bg-gray-950/50">
                  {relatedPips.slice(0, 10).map((pip, j) => (
                    <div
                      key={pip.id}
                      className={`px-6 py-2.5 ${j !== relatedPips.length - 1 ? "border-b border-gray-800/50" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <SeverityBadge severity={pip.severity} />
                        <p className="text-sm text-gray-300 leading-snug">{pip.pip_text}</p>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 ml-10">
                        {pip.agent_type === "ai" ? "🤖" : "👤"} {pip.agent_name}
                        {pip.team_name && ` · ${pip.team_name}`}
                        {pip.classification_rationale && (
                          <span className="italic ml-1">— {pip.classification_rationale}</span>
                        )}
                      </p>
                    </div>
                  ))}
                  {relatedPips.length > 10 && (
                    <div className="px-6 py-2 text-xs text-gray-500">
                      +{relatedPips.length - 10} more PIPs in this category
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
