import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * KpiCard — single KPI tile.
 * Props: label, value, delta? ("+12%" / "-3"), Icon, tone? ("default" | "warning" | "danger" | "success")
 */
const tones = {
  default: "bg-white border-neutral-200 text-neutral-950",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  danger:  "bg-red-50 border-red-200 text-red-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
};

export default function KpiCard({ label, value, sub, Icon, tone = "default", testid }) {
  return (
    <div data-testid={testid} className={`p-5 border ${tones[tone]} flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-500">{label}</div>
        {Icon && <Icon className="w-4 h-4 text-neutral-500 shrink-0" strokeWidth={2} />}
      </div>
      <div className="font-display font-medium text-3xl tracking-tight leading-none">{value}</div>
      {sub && <div className="font-mono text-[11px] text-neutral-500">{sub}</div>}
    </div>
  );
}
