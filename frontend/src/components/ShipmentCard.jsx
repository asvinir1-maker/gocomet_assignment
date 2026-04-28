import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Package, Weight } from "lucide-react";
import ModeIcon, { modeMeta } from "./ModeIcon";
import StatusBadge from "./StatusBadge";
import { fmtDate, flagEmoji } from "../lib/format";

export default function ShipmentCard({ s }) {
  return (
    <Link
      to={`/shipment/${s.id}`}
      data-testid="shipment-card"
      className="border border-neutral-200 bg-white p-6 hover:border-neutral-950 hover:shadow-lg hover:-translate-y-[2px] transition-all flex flex-col gap-5 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Shipment ID</div>
          <div className="font-mono text-base text-neutral-950 mt-0.5">{s.id}</div>
          <div className="text-xs text-neutral-500 mt-0.5">REF: {s.reference}</div>
        </div>
        <StatusBadge status={s.status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Origin</div>
          <div className="font-medium text-neutral-950 text-sm mt-0.5 flex items-center gap-1.5">
            <span>{flagEmoji(s.origin_country)}</span>
            <span className="truncate">{s.origin}</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Destination</div>
          <div className="font-medium text-neutral-950 text-sm mt-0.5 flex items-center gap-1.5">
            <span>{flagEmoji(s.destination_country)}</span>
            <span className="truncate">{s.destination}</span>
          </div>
        </div>
      </div>

      {/* mode chips */}
      <div className="flex items-center gap-1.5">
        {s.modes.map((m, i) => (
          <React.Fragment key={i}>
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold tracking-[0.18em] uppercase border ${modeMeta[m].bg} ${modeMeta[m].text} ${modeMeta[m].border}`}>
              <ModeIcon mode={m} size="sm" />
            </span>
            {i < s.modes.length - 1 && <ArrowRight className="w-3 h-3 text-neutral-400" />}
          </React.Fragment>
        ))}
      </div>

      {/* mini progress */}
      <div>
        <div className="flex justify-between text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400 mb-1.5">
          <span>Progress</span>
          <span className="font-mono text-neutral-700">{s.progress}%</span>
        </div>
        <div className="h-1 bg-neutral-200 relative">
          <div className={`absolute left-0 top-0 h-full ${
            s.status === "delayed" ? "bg-red-600" :
            s.status === "completed" ? "bg-neutral-950" :
            "bg-amber-500"
          }`} style={{ width: `${s.progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-neutral-200 pt-4 mt-auto">
        <div className="flex items-center gap-4 text-[11px] text-neutral-500 font-mono">
          <span className="flex items-center gap-1"><Package className="w-3 h-3" />{s.container_count} CTR</span>
          <span className="flex items-center gap-1"><Weight className="w-3 h-3" />{s.weight_kg.toLocaleString()}kg</span>
        </div>
        <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-700 group-hover:text-neutral-950 flex items-center gap-1">
          ETA {fmtDate(s.eta)} <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}
