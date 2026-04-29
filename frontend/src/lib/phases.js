// =============================================================
// Phase helpers — UI abstraction over offset_pct.
// Backend still stores offset_pct (-50 to 150). The UI only
// surfaces these named phases so users don't see raw math.
// =============================================================

export const PHASES = [
  { key: "pre",       label: "Pre-shipment",  pct: -10 },
  { key: "departure", label: "At departure",  pct: 0   },
  { key: "early",     label: "Early transit", pct: 25  },
  { key: "mid",       label: "Mid-transit",   pct: 50  },
  { key: "late",      label: "Late transit",  pct: 75  },
  { key: "arrival",   label: "At arrival",    pct: 100 },
  { key: "post",      label: "Post-arrival",  pct: 110 },
];

// Closest phase for a given offset_pct
export function pctToPhase(pct) {
  const p = typeof pct === "number" ? pct : 50;
  return PHASES.reduce(
    (closest, phase) =>
      Math.abs(phase.pct - p) < Math.abs(closest.pct - p) ? phase : closest,
    PHASES[0],
  );
}

export function phaseLabel(pct) {
  return pctToPhase(pct).label;
}

export function phaseKeyToPct(key) {
  return PHASES.find((p) => p.key === key)?.pct ?? 50;
}
