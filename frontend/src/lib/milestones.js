// =============================================================
// Milestone engine
// - Standard mode-based milestones (defaults below)
// - Optional template (replaces the standard set per mode)
// - Optional per-leg custom milestones (added on top)
// - Each milestone has an offset_pct: % position relative to leg
//     -50 = before leg started, 0 = at leg.departure,
//     100 = at leg.arrival, 150 = after leg ended
// =============================================================

// Standard milestones with realistic offset_pct positions inside the leg
const STANDARD_AIR = [
  { code: "BKG", label: "Booking Confirmed", offset_pct: -10 },
  { code: "RCS", label: "Received at Origin Terminal", offset_pct: -2 },
  { code: "LOD", label: "Loaded on Flight", offset_pct: 5 },
  { code: "DEP", label: "Departed", offset_pct: 10 },
  { code: "ARR", label: "Arrived", offset_pct: 80 },
  { code: "CCL", label: "Customs Clearance", offset_pct: 92 },
  { code: "NFD", label: "Ready for Pickup", offset_pct: 100 },
];

const STANDARD_OCEAN = [
  { code: "BKG", label: "Booking Confirmed", offset_pct: -8 },
  { code: "CST", label: "Container Stuffed", offset_pct: -3 },
  { code: "GTI", label: "Gate In at Origin Port", offset_pct: -2 },
  { code: "LOD", label: "Loaded on Vessel", offset_pct: -1 },
  { code: "DEP", label: "Vessel Departed", offset_pct: 0 },
  { code: "TRN", label: "In Transit", offset_pct: 50 },
  { code: "ARR", label: "Vessel Arrived", offset_pct: 95 },
  { code: "DIS", label: "Discharged from Vessel", offset_pct: 96 },
  { code: "CCL", label: "Customs Cleared", offset_pct: 98 },
  { code: "GTO", label: "Gate Out", offset_pct: 100 },
];

const STANDARD_ROAD = [
  { code: "PSC", label: "Pickup Scheduled", offset_pct: -5 },
  { code: "PUP", label: "Picked Up", offset_pct: 0 },
  { code: "TRN", label: "In Transit", offset_pct: 50 },
  { code: "ARH", label: "Arrived at Hub", offset_pct: 75 },
  { code: "OFD", label: "Out for Delivery", offset_pct: 92 },
  { code: "DLV", label: "Delivered", offset_pct: 100 },
];

export const STANDARD_TEMPLATE = {
  id: "TPL-STANDARD",
  name: "Standard",
  description: "Default mode-based milestones (built-in)",
  is_builtin: true,
  is_standard: true,
  milestones: { air: STANDARD_AIR, ocean: STANDARD_OCEAN, road: STANDARD_ROAD },
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// ---- Generic helpers ----
export const daysBetween = (a, b) => {
  if (!a || !b) return 0;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round((ms / DAY) * 10) / 10);
};
export const daysBetweenInt = (a, b) => Math.round(daysBetween(a, b));
export const getJourneyStart = (legs) => (legs && legs.length ? legs[0].departure : null);
export const getJourneyEnd = (legs) => (legs && legs.length ? legs[legs.length - 1].arrival : null);
export const getJourneyDurationDays = (legs) => {
  const s = getJourneyStart(legs), e = getJourneyEnd(legs);
  return s && e ? daysBetweenInt(s, e) : 0;
};
export const getLegDurationDays = (leg) => daysBetween(leg.departure, leg.arrival);

// ---- Milestone resolution ----
function resolveBaseMilestones(leg, template) {
  const tpl = template && template.milestones ? template : STANDARD_TEMPLATE;
  const list = (tpl.milestones && tpl.milestones[leg.mode]) || [];
  if (list.length === 0) {
    // Fallback to standard if template lacks this mode
    return STANDARD_TEMPLATE.milestones[leg.mode] || [];
  }
  return list;
}

function offsetToTimestamp(leg, offsetPct) {
  const dep = new Date(leg.departure).getTime();
  const arr = new Date(leg.arrival).getTime();
  const span = Math.max(arr - dep, HOUR);
  return new Date(dep + (span * offsetPct) / 100).toISOString();
}

/**
 * Build the resolved milestone list for a leg, given an optional template
 * and optional per-leg custom milestones. Custom milestones are merged in
 * by offset_pct and tagged with custom: true so the UI can show a remove btn.
 */
export function getLegMilestones(leg, options = {}) {
  if (!leg) return [];
  const { template = null, customMilestones = [] } = options;

  const baseList = resolveBaseMilestones(leg, template).map((m) => ({
    code: m.code,
    label: m.label,
    offset_pct: typeof m.offset_pct === "number" ? m.offset_pct : 50,
    custom: false,
  }));

  const legCustom = (customMilestones || [])
    .filter((c) => (c.leg_id || "").toUpperCase() === (leg.leg_id || "").toUpperCase())
    .map((c) => ({
      code: c.code,
      label: c.label,
      offset_pct: typeof c.offset_pct === "number" ? c.offset_pct : 50,
      custom: true,
      custom_id: c.id,
      notes: c.notes || null,
    }));

  // Merge + sort by offset_pct
  const merged = [...baseList, ...legCustom].sort((a, b) => a.offset_pct - b.offset_pct);

  // Compute planned ts from offset
  const withTs = merged.map((m) => ({
    ...m,
    planned: offsetToTimestamp(leg, m.offset_pct),
  }));

  const now = Date.now();
  const N = withTs.length;
  const legStatus = leg.status;

  return withTs.map((m, i) => {
    const t = new Date(m.planned).getTime();
    const prevT = i > 0 ? new Date(withTs[i - 1].planned).getTime() : -Infinity;

    let status = "upcoming";
    let actual = null;

    if (legStatus === "completed") {
      status = "completed";
      actual = m.planned;
    } else if (legStatus === "scheduled") {
      status = "upcoming";
    } else if (legStatus === "in_transit" || legStatus === "active") {
      if (i === N - 1) {
        status = prevT <= now ? "current" : "upcoming";
      } else if (t <= now) {
        status = "completed";
        actual = m.planned;
      } else if (prevT <= now) {
        status = "current";
      }
    } else if (legStatus === "delayed") {
      if (i === N - 1) {
        status = prevT <= now ? "delayed" : "upcoming";
      } else if (t <= now) {
        status = "completed";
        actual = m.planned;
      } else if (prevT <= now) {
        status = "delayed";
      }
    }
    return { ...m, status, actual };
  });
}

export function getMilestoneSummary(leg, options = {}) {
  const milestones = getLegMilestones(leg, options);
  const completed = milestones.filter((m) => m.status === "completed").length;
  return { completed, total: milestones.length, milestones };
}
