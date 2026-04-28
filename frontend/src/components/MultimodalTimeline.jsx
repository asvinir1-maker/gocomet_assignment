import React from "react";
import { MapPin, Clock, Building2, ChevronRight } from "lucide-react";
import ModeIcon, { modeMeta } from "./ModeIcon";
import StatusBadge from "./StatusBadge";
import LegMilestones from "./LegMilestones";
import { fmtDateTime, flagEmoji } from "../lib/format";

const stepStatusColor = (status) => {
  if (status === "completed") return "bg-neutral-950";
  if (status === "in_transit" || status === "active") return "bg-amber-500";
  if (status === "delayed") return "bg-red-600";
  return "bg-neutral-300";
};

export default function MultimodalTimeline({ shipment }) {
  if (!shipment) return null;
  const { legs, progress } = shipment;

  return (
    <div data-testid="unified-timeline" className="w-full fade-up">
      {/* Progress strip */}
      <div className="flex items-center gap-4 mb-6">
        <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Journey Progress</div>
        <div className="flex-1 h-1 bg-neutral-200 relative">
          <div className="absolute left-0 top-0 h-full bg-neutral-950" style={{ width: `${progress}%` }} />
        </div>
        <div className="font-mono text-sm text-neutral-950">{progress}%</div>
      </div>

      {/* Horizontal timeline */}
      <div className="border border-neutral-200 bg-white">
        <div className="flex items-stretch overflow-x-auto no-scrollbar">
          {legs.map((leg, idx) => {
            const meta = modeMeta[leg.mode];
            const isLast = idx === legs.length - 1;
            const active = leg.status === "in_transit" || leg.status === "active";
            return (
              <React.Fragment key={leg.leg_id}>
                <div
                  data-testid="timeline-node"
                  className="flex-1 min-w-[260px] p-5 border-r border-neutral-200 last:border-r-0 relative"
                >
                  {/* connector dot row */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-2.5 h-2.5 rounded-full ${stepStatusColor(leg.status)} ${active ? "leg-pulse" : ""}`} />
                    <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">
                      Leg {leg.sequence} / {legs.length}
                    </span>
                  </div>

                  {/* mode + carrier */}
                  <div className="flex items-start gap-3 mb-4">
                    <ModeIcon mode={leg.mode} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className={`inline-flex items-center text-[10px] font-bold tracking-[0.2em] uppercase px-1.5 py-0.5 ${meta.bg} ${meta.text} border ${meta.border}`}>
                        {meta.label}
                      </div>
                      <div className="font-display font-medium text-neutral-950 mt-1.5 leading-tight truncate">{leg.carrier}</div>
                      <div className="font-mono text-[11px] text-neutral-500 mt-0.5 truncate">{leg.vehicle_ref}</div>
                    </div>
                  </div>

                  {/* from / to */}
                  <div className="space-y-2.5 mt-2">
                    <div>
                      <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">From</div>
                      <div className="font-medium text-neutral-950 text-sm leading-tight mt-0.5">{leg.from_location}</div>
                      <div className="font-mono text-[11px] text-neutral-500">{leg.from_code} · {fmtDateTime(leg.departure)}</div>
                    </div>
                    <div className="border-t border-dashed border-neutral-200" />
                    <div>
                      <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">To</div>
                      <div className="font-medium text-neutral-950 text-sm leading-tight mt-0.5">{leg.to_location}</div>
                      <div className="font-mono text-[11px] text-neutral-500">{leg.to_code} · {fmtDateTime(leg.arrival)}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <StatusBadge status={leg.status} />
                    {leg.notes && (
                      <span className="text-[11px] text-neutral-500 italic truncate ml-2 max-w-[140px]" title={leg.notes}>
                        {leg.notes}
                      </span>
                    )}
                  </div>

                  <LegMilestones leg={leg} defaultOpen={active} />
                </div>
                {!isLast && (
                  <div className="hidden md:flex items-center justify-center w-8 -mx-4 z-10 bg-white">
                    <div className="w-7 h-7 rounded-full bg-white border border-neutral-300 flex items-center justify-center shadow-sm">
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Origin → Destination summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 mt-6 border border-neutral-200">
        <div className="bg-white p-5">
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Origin</div>
          <div className="font-display text-xl font-medium text-neutral-950 mt-1 flex items-center gap-2">
            <span>{flagEmoji(shipment.origin_country)}</span>{shipment.origin}
          </div>
          <div className="font-mono text-xs text-neutral-500 mt-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> {shipment.consignor}
          </div>
        </div>
        <div className="bg-white p-5">
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Estimated Arrival</div>
          <div className="font-display text-xl font-medium text-neutral-950 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" />{shipment.eta}
          </div>
          <div className="font-mono text-xs text-neutral-500 mt-1">Booked {shipment.booking_date}</div>
        </div>
        <div className="bg-white p-5">
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Destination</div>
          <div className="font-display text-xl font-medium text-neutral-950 mt-1 flex items-center gap-2">
            <span>{flagEmoji(shipment.destination_country)}</span>{shipment.destination}
          </div>
          <div className="font-mono text-xs text-neutral-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {shipment.consignee}
          </div>
        </div>
      </div>
    </div>
  );
}
