import React from "react";

const styles = {
  active:    "bg-amber-50 text-amber-800 border-amber-200",
  completed: "bg-neutral-950 text-white border-neutral-950",
  delayed:   "bg-red-50 text-red-700 border-red-200",
  scheduled: "bg-neutral-100 text-neutral-700 border-neutral-200",
  in_transit:"bg-amber-50 text-amber-800 border-amber-200",
};

const labels = {
  active: "Active",
  completed: "Completed",
  delayed: "Delayed",
  scheduled: "Scheduled",
  in_transit: "In Transit",
};

export default function StatusBadge({ status, className = "" }) {
  const s = styles[status] || styles.scheduled;
  return (
    <span
      data-testid="status-badge"
      className={`inline-flex items-center px-2 py-1 text-[10px] font-bold tracking-[0.18em] uppercase border ${s} ${className}`}
    >
      <span className={`w-1.5 h-1.5 mr-2 ${
        status === "completed" ? "bg-white" :
        status === "delayed" ? "bg-red-600" :
        status === "active" || status === "in_transit" ? "bg-amber-600 leg-pulse" :
        "bg-neutral-500"
      }`} />
      {labels[status] || status}
    </span>
  );
}
