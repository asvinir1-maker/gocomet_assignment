import React from "react";
import { Truck, Ship, Plane } from "lucide-react";

export const modeMeta = {
  road:  { label: "Road",  Icon: Truck, bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", icon: "text-emerald-700" },
  ocean: { label: "Ocean", Icon: Ship,  bg: "bg-blue-50",    text: "text-blue-800",    border: "border-blue-200",    icon: "text-blue-700" },
  air:   { label: "Air",   Icon: Plane, bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200",     icon: "text-sky-600" },
};

export default function ModeIcon({ mode, size = "md" }) {
  const m = modeMeta[mode] || modeMeta.road;
  const Icon = m.Icon;
  const dim = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-14 h-14" : "w-11 h-11";
  const ico = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  return (
    <div className={`${dim} ${m.bg} ${m.border} border flex items-center justify-center shrink-0`}>
      <Icon className={`${ico} ${m.icon}`} strokeWidth={2} />
    </div>
  );
}
