import React from "react";
import { Megaphone, Globe } from "lucide-react";
import { roleColor } from "../lib/remarksApi";
import { fmtDateTime } from "../lib/format";

/**
 * PublicRemarks — customer-facing list of public team updates.
 * Only shows remarks where visibility="public".
 */
export default function PublicRemarks({ remarks, shipment }) {
  if (!remarks || remarks.length === 0) return null;

  const legs = (shipment && shipment.legs) || [];
  const findLeg = (legId) => legs.find((l) => l.leg_id === legId);

  return (
    <div data-testid="public-remarks" className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-4 h-4 text-emerald-700" />
        <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-500">
          Updates from our Team
        </div>
        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 ml-1">
          {remarks.length} message{remarks.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-3">
        {remarks.map((r) => {
          const leg = findLeg(r.leg_id);
          return (
            <div
              key={r.id}
              data-testid={`public-remark-${r.id}`}
              className="border-l-4 border-l-emerald-500 border-y border-r border-neutral-200 bg-white p-4 flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {(r.author_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-medium text-neutral-950">{r.author_name}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 border tracking-wider uppercase ${roleColor(r.author_role)}`}>
                    {r.author_role}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-700">
                    <Globe className="w-2.5 h-2.5" /> Public
                  </span>
                </div>
                <div className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">{r.message}</div>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono text-neutral-500">
                  <span>{fmtDateTime(r.created_at)}</span>
                  {leg && (
                    <>
                      <span>·</span>
                      <span>{leg.mode.toUpperCase()} · {leg.from_location} → {leg.to_location}</span>
                    </>
                  )}
                  {r.milestone_code && (
                    <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-700">
                      {r.milestone_code}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
