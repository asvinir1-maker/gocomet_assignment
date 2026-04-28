import React, { useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";

const Section = ({ title, children, defaultOpen = true, testid }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-200 py-4" data-testid={testid}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-700 hover:text-neutral-950"
      >
        <span>{title}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-3 flex flex-col gap-2">{children}</div>}
    </div>
  );
};

const CheckRow = ({ checked, onChange, label, count, testid }) => (
  <label
    className="flex items-center gap-2.5 cursor-pointer text-sm text-neutral-700 hover:text-neutral-950"
    data-testid={testid}
  >
    <span
      className={`w-4 h-4 border flex items-center justify-center shrink-0 transition-colors ${
        checked ? "bg-neutral-950 border-neutral-950" : "bg-white border-neutral-300"
      }`}
    >
      {checked && (
        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
    <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="flex-1">{label}</span>
    {count !== undefined && (
      <span className="font-mono text-[11px] text-neutral-400">{count}</span>
    )}
  </label>
);

export default function FilterRail({ filters, setFilters, options, counts, onClear }) {
  const toggleArray = (key, value) => {
    const arr = filters[key] || [];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    setFilters({ ...filters, [key]: next });
  };

  const activeCount =
    (filters.status?.length || 0) +
    (filters.modes?.length || 0) +
    (filters.origins?.length || 0) +
    (filters.destinations?.length || 0) +
    (filters.carriers?.length || 0) +
    (filters.delayedOverDays > 0 ? 1 : 0) +
    (filters.audience !== "all" ? 1 : 0) +
    (filters.search ? 1 : 0);

  return (
    <aside data-testid="filter-rail" className="border border-neutral-200 bg-white px-5 py-4 sticky top-4 self-start">
      <div className="flex items-center justify-between pb-2">
        <div className="font-display font-medium text-lg text-neutral-950">Filters</div>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            data-testid="filter-clear-all"
            className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 hover:text-neutral-950 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear ({activeCount})
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative pb-1 mt-2" data-testid="filter-search">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Search ID, ref, party…"
          className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 focus:border-neutral-950 focus:outline-none bg-white placeholder:text-neutral-400"
          data-testid="filter-search-input"
        />
      </div>

      {/* Audience */}
      <Section title="Audience" testid="filter-section-audience">
        {[
          { k: "all", l: "All" },
          { k: "shipper", l: "Shipper Shipments" },
          { k: "customer", l: "Customer Orders" },
        ].map((o) => (
          <label key={o.k} className="flex items-center gap-2.5 cursor-pointer text-sm text-neutral-700" data-testid={`filter-audience-${o.k}`}>
            <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
              filters.audience === o.k ? "border-neutral-950" : "border-neutral-300"
            }`}>
              {filters.audience === o.k && <span className="w-2 h-2 rounded-full bg-neutral-950" />}
            </span>
            <input type="radio" name="audience" className="hidden" checked={filters.audience === o.k}
                   onChange={() => setFilters({ ...filters, audience: o.k })} />
            {o.l}
          </label>
        ))}
      </Section>

      {/* Status */}
      <Section title="Status" testid="filter-section-status">
        {["active", "completed", "delayed", "scheduled"].map((s) => (
          <CheckRow key={s} label={s[0].toUpperCase() + s.slice(1)}
                    checked={filters.status?.includes(s)}
                    onChange={() => toggleArray("status", s)}
                    count={counts.byStatus[s] || 0}
                    testid={`filter-status-${s}`} />
        ))}
      </Section>

      {/* Mode */}
      <Section title="Transport Mode" testid="filter-section-mode">
        {["road", "ocean", "air"].map((m) => (
          <CheckRow key={m} label={m[0].toUpperCase() + m.slice(1)}
                    checked={filters.modes?.includes(m)}
                    onChange={() => toggleArray("modes", m)}
                    count={counts.byMode[m] || 0}
                    testid={`filter-mode-${m}`} />
        ))}
      </Section>

      {/* Delay threshold */}
      <Section title="Delay" testid="filter-section-delay">
        {[
          { v: 0, l: "Any" },
          { v: 1, l: "Delayed (1+ days)" },
          { v: 7, l: "Delayed > 7 days" },
          { v: 14, l: "Delayed > 14 days" },
        ].map((o) => (
          <label key={o.v} className="flex items-center gap-2.5 cursor-pointer text-sm text-neutral-700" data-testid={`filter-delay-${o.v}`}>
            <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
              filters.delayedOverDays === o.v ? "border-neutral-950" : "border-neutral-300"
            }`}>
              {filters.delayedOverDays === o.v && <span className="w-2 h-2 rounded-full bg-neutral-950" />}
            </span>
            <input type="radio" name="delay" className="hidden" checked={filters.delayedOverDays === o.v}
                   onChange={() => setFilters({ ...filters, delayedOverDays: o.v })} />
            {o.l}
          </label>
        ))}
      </Section>

      {/* Origin country */}
      <Section title="Origin Country" defaultOpen={false} testid="filter-section-origin">
        {options.origins.length === 0 && <div className="text-xs text-neutral-400">—</div>}
        {options.origins.map((c) => (
          <CheckRow key={c} label={c}
                    checked={filters.origins?.includes(c)}
                    onChange={() => toggleArray("origins", c)}
                    count={counts.byOrigin[c] || 0}
                    testid={`filter-origin-${c}`} />
        ))}
      </Section>

      {/* Destination country */}
      <Section title="Destination Country" defaultOpen={false} testid="filter-section-destination">
        {options.destinations.length === 0 && <div className="text-xs text-neutral-400">—</div>}
        {options.destinations.map((c) => (
          <CheckRow key={c} label={c}
                    checked={filters.destinations?.includes(c)}
                    onChange={() => toggleArray("destinations", c)}
                    count={counts.byDestination[c] || 0}
                    testid={`filter-destination-${c}`} />
        ))}
      </Section>

      {/* Carrier */}
      <Section title="Carrier" defaultOpen={false} testid="filter-section-carrier">
        <div className="max-h-48 overflow-y-auto flex flex-col gap-2 pr-1">
          {options.carriers.length === 0 && <div className="text-xs text-neutral-400">—</div>}
          {options.carriers.map((c) => (
            <CheckRow key={c} label={c}
                      checked={filters.carriers?.includes(c)}
                      onChange={() => toggleArray("carriers", c)}
                      count={counts.byCarrier[c] || 0}
                      testid={`filter-carrier-${c.replace(/\s+/g, "_")}`} />
          ))}
        </div>
      </Section>
    </aside>
  );
}
