import React from "react";
import { Building2, User } from "lucide-react";

/**
 * ViewToggle — Shipper (B2B) vs Customer (end-consumer) view switcher.
 */
export default function ViewToggle({ value, onChange }) {
  const options = [
    { key: "shipper",  label: "Shipper",  desc: "Operations view", Icon: Building2 },
    { key: "customer", label: "Customer", desc: "Track my order",  Icon: User },
  ];
  return (
    <div data-testid="view-toggle" className="inline-flex items-stretch border border-neutral-200 bg-white p-1 gap-1">
      {options.map((o) => {
        const active = value === o.key;
        const Icon = o.Icon;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            data-testid={`view-toggle-${o.key}`}
            className={`flex items-center gap-2.5 px-3.5 py-2 transition-colors ${
              active
                ? "bg-neutral-950 text-white"
                : "text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase">{o.label}</span>
              <span className={`text-[9px] tracking-[0.15em] uppercase ${active ? "text-white/60" : "text-neutral-400"}`}>{o.desc}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
