import React, { useState } from "react";
import { ChevronDown, Check, AlertTriangle, Plus, Trash2, Sparkles, MessageSquare } from "lucide-react";
import { getMilestoneSummary, getLegDurationDays, daysBetween } from "../lib/milestones";
import { fmtDateTime } from "../lib/format";
import { deleteCustomMilestone } from "../lib/templatesApi";
import AddCustomMilestoneDialog from "./AddCustomMilestoneDialog";
import { toast } from "sonner";

const dotClass = (status, custom) => {
  let base = "";
  if (status === "completed") base = "bg-emerald-500 border-emerald-500 text-white";
  else if (status === "current") base = "bg-amber-500 border-amber-500 text-white";
  else if (status === "delayed") base = "bg-red-600 border-red-600 text-white";
  else base = "bg-white border-neutral-300 text-neutral-300";
  if (custom && status === "upcoming") base = "bg-white border-violet-400 text-violet-400";
  return base;
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

export default function LegMilestones({
  shipmentId,
  leg,
  journeyStart,
  template = null,
  customMilestones = [],
  remarks = [],
  defaultOpen = false,
  onCustomChanged = null,
  onJumpToRemarks = null,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { completed, total, milestones } = getMilestoneSummary(leg, {
    template,
    customMilestones,
  });
  const legDays = getLegDurationDays(leg);
  const customCount = milestones.filter((m) => m.custom).length;

  const accent =
    completed === total
      ? "text-emerald-700"
      : leg.status === "delayed"
      ? "text-red-700"
      : "text-amber-700";

  const handleDeleteCustom = async (id, label) => {
    if (!window.confirm(`Remove "${label}"?`)) return;
    try {
      await deleteCustomMilestone(id);
      toast.success("Milestone removed");
      onCustomChanged && onCustomChanged();
    } catch {
      toast.error("Failed to remove");
    }
  };

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
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400 flex items-center gap-2">
            Milestones
            {customCount > 0 && (
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-violet-100 text-violet-700 border border-violet-200 normal-case tracking-normal flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> +{customCount} custom
              </span>
            )}
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
            return (
              <div key={`${m.code}-${i}`} className="flex gap-3 items-stretch group">
                {/* dot + connector column */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] shrink-0 ${dotClass(
                      m.status,
                      m.custom,
                    )}`}
                  >
                    {m.status === "completed" && <Check className="w-3 h-3" />}
                    {m.status === "delayed" && <AlertTriangle className="w-2.5 h-2.5" />}
                    {m.status === "current" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                    {m.status === "upcoming" && m.custom && (
                      <Sparkles className="w-2.5 h-2.5" />
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
                      {m.custom && (
                        <span className="ml-1.5 font-mono text-[9px] text-violet-700 bg-violet-50 px-1.5 py-0.5 border border-violet-200 align-middle">
                          CUSTOM
                        </span>
                      )}
                      {(() => {
                        const cnt = remarks.filter(
                          (r) =>
                            (r.leg_id || "").toUpperCase() === (leg.leg_id || "").toUpperCase() &&
                            (r.milestone_code || "").toUpperCase() === (m.code || "").toUpperCase(),
                        ).length;
                        if (cnt === 0) return null;
                        const pubCnt = remarks.filter(
                          (r) =>
                            (r.leg_id || "").toUpperCase() === (leg.leg_id || "").toUpperCase() &&
                            (r.milestone_code || "").toUpperCase() === (m.code || "").toUpperCase() &&
                            r.visibility === "public",
                        ).length;
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onJumpToRemarks && onJumpToRemarks();
                            }}
                            data-testid={`milestone-remark-badge-${leg.leg_id}-${m.code}`}
                            className="ml-1.5 inline-flex items-center gap-1 font-mono text-[9px] text-blue-700 bg-blue-50 px-1.5 py-0.5 border border-blue-200 hover:bg-blue-100 align-middle"
                            title={`${cnt} remark${cnt === 1 ? "" : "s"} (${pubCnt} public)`}
                          >
                            <MessageSquare className="w-2.5 h-2.5" />
                            {cnt}
                            {pubCnt > 0 && <span className="text-emerald-700">·{pubCnt}</span>}
                          </button>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {dayFromJourney !== null && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-700 whitespace-nowrap">
                          {fmtDays(dayFromJourney)}
                        </span>
                      )}
                      {m.custom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustom(m.custom_id, m.label);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-600 hover:bg-red-50 rounded"
                          aria-label="Remove custom milestone"
                          data-testid={`remove-custom-${m.custom_id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
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
                  {m.notes && (
                    <div className="text-[10px] text-violet-700 italic mt-0.5">{m.notes}</div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add custom milestone button */}
          {shipmentId && (
            <div className="mt-2 pt-2 border-t border-dashed border-neutral-200">
              <AddCustomMilestoneDialog
                shipmentId={shipmentId}
                leg={leg}
                onAdded={() => onCustomChanged && onCustomChanged()}
                trigger={
                  <button
                    type="button"
                    data-testid={`add-custom-btn-${leg.leg_id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-mono uppercase tracking-wider text-neutral-500 hover:text-neutral-950 hover:bg-neutral-50 border border-dashed border-neutral-300 hover:border-neutral-500 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Custom Milestone
                  </button>
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
