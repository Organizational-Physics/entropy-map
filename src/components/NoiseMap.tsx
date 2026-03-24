"use client";

import { Pip } from "@/app/dashboard/page";
import { SeverityBadge, PsiuBadge } from "@/app/dashboard/page";

interface Props {
  pips: Pip[];
  onPipClick: (pip: Pip) => void;
}

export default function NoiseMap({ pips, onPipClick }: Props) {
  if (pips.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
        No PIPs yet — submit your first PIP via the API.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-300">Noise Map</h2>
        <span className="text-xs text-gray-500">{pips.length} PIPs — click any to expand</span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {pips.map((pip, i) => (
          <div
            key={pip.id}
            className={`px-4 py-3 cursor-pointer hover:bg-gray-800/50 transition-colors ${
              i !== pips.length - 1 ? "border-b border-gray-800" : ""
            }`}
            onClick={() => onPipClick(pip)}
          >
            <div className="flex items-start gap-3">
              <SeverityBadge severity={pip.severity} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 leading-snug line-clamp-2">{pip.pip_text}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {pip.category_name ? (
                    <PsiuBadge quadrant={pip.psiu_quadrant || ""} label={pip.category_name} />
                  ) : (
                    <span className="text-xs text-gray-600 italic">classifying…</span>
                  )}
                  <span className="text-xs text-gray-600">
                    {pip.agent_type === "ai" ? "🤖" : "👤"} {pip.agent_name}
                  </span>
                  {pip.team_name && <span className="text-xs text-gray-600">· {pip.team_name}</span>}
                  <span className="text-xs text-gray-600">
                    · {new Date(pip.submitted_at).toLocaleDateString()}
                  </span>
                  {pip.classification_confidence !== null && pip.classification_confidence < 0.6 && (
                    <span className="text-xs text-yellow-600">⚠ low confidence</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
