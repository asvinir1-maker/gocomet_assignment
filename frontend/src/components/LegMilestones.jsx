import React, { useState } from "react";
import { ChevronDown, Check, AlertTriangle } from "lucide-react";
import { getMilestoneSummary, getLegDurationDays, daysBetween } from "../lib/milestones";
import { fmtDateTime } from "../lib/format";

const dotClass = (status) => {
  if (status === "completed") return "bg-emerald-500 border-emerald-500 text-white";
  if (status === "current") return "bg-amber-500 border-amber-500 text-white";
  if (status === "delayed") return "bg-red-600 border-red-600 text-white";
  return "bg-white border-neutral-300 text-neutral-300";
};

const lineClass = (status) => {
  if (status === "completed") return "bg-emerald-500";
  if (status === "current") return "bg-amber-400";
  if (status === "delayed") return "bg-red-500";
  return "bg-neutral-200";
};

const fmtDays = (d) => {
  if (d === null || d === undefined) return "—";
  if (d < 0.05) return "Day 0";
  if (d < 1) return `Day +${Math.round(d * 24)}h`;
  if (Number.isInteger(d)) return `Day ${d}`;
  return `Day ${d.toFixed(1)}`;
};

export default function LegMilestones({ leg, journeyStart, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const { completed, total, milestones } = getMilestoneSummary(leg);
  const legDays = getLegDurationDays(leg);

  const accent =
    completed === total
      ? "text-emerald-700"
      : leg.status === "delayed"
      ? "text-red-700"
      : "text-amber-700";

  return (
    <div
      data-testid={`leg-milestones-${leg.leg_id}`}
      className="mt-4 border-t border-neutral-200 pt-3"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-left group hover:opacity-80 transition-opacity"
      >
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">
            Milestones
          </div>
          <div className={`font-mono text-[11px] mt-0.5 ${accent}`}>
            {completed} / {total} reached
            <span className="text-neutral-400 ml-2">·</span>
            <span className="text-neutral-600 ml-2">
              Leg duration: {legDays} {legDays === 1 ? "day" : "days"}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="mt-3" data-testid={`leg-milestones-list-${leg.leg_id}`}>
          {milestones.map((m, i) => {
            const isLast = i === milestones.length - 1;
            const dayFromJourney = journeyStart
              ? daysBetween(journeyStart, m.planned)
              : null;
            const dayFromLegStart = daysBetween(leg.departure, m.planned);
            return (
              <div key={m.code} className="flex gap-3 items-stretch">
                {/* dot + connector column */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] shrink-0 ${dotClass(
                      m.status
                    )}`}
                  >
                    {m.status === "completed" && <Check className="w-3 h-3" />}
                    {m.status === "delayed" && <AlertTriangle className="w-2.5 h-2.5" />}
                    {m.status === "current" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 flex-1 ${lineClass(m.status)} my-0.5 min-h-[18px]`} />
                  )}
                </div>

                {/* label + dates + day chip */}
                <div className={`flex-1 ${isLast ? "pb-0" : "pb-3"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium text-neutral-900 leading-tight">
                      {m.label}
                      <span className="ml-1.5 font-mono text-[10px] text-neutral-400">
                        ({m.code})
                      </span>
                    </div>
                    {dayFromJourney !== null && (
                      <span
                        className="font-mono text-[10px] px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-700 whitespace-nowrap"
                        title={`Day ${Math.round(dayFromLegStart)} of this leg`}
                      >
                        {fmtDays(dayFromJourney)}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>
                      <span className="text-neutral-400">Planned:</span> {fmtDateTime(m.planned)}
                    </span>
                    <span>
                      <span className="text-neutral-400">Actual:</span>{" "}
                      {m.actual ? (
                        <span className="text-emerald-700">{fmtDateTime(m.actual)}</span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
