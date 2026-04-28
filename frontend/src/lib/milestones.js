// Mode-specific milestone definitions for each journey leg.
// Codes follow common logistics conventions (RCS/LOD/DEP/ARR/NFD/etc.)

const AIR_MILESTONES = [
  { code: "BKG", label: "Booking Confirmed" },
  { code: "RCS", label: "Received at Origin Terminal" },
  { code: "LOD", label: "Loaded on Flight" },
  { code: "DEP", label: "Departed" },
  { code: "ARR", label: "Arrived" },
  { code: "CCL", label: "Customs Clearance" },
  { code: "NFD", label: "Ready for Pickup" },
];

const OCEAN_MILESTONES = [
  { code: "BKG", label: "Booking Confirmed" },
  { code: "CST", label: "Container Stuffed" },
  { code: "GTI", label: "Gate In at Origin Port" },
  { code: "LOD", label: "Loaded on Vessel" },
  { code: "DEP", label: "Vessel Departed" },
  { code: "TRN", label: "In Transit" },
  { code: "ARR", label: "Vessel Arrived" },
  { code: "DIS", label: "Discharged from Vessel" },
  { code: "CCL", label: "Customs Cleared" },
  { code: "GTO", label: "Gate Out" },
];

const ROAD_MILESTONES = [
  { code: "PSC", label: "Pickup Scheduled" },
  { code: "PUP", label: "Picked Up" },
  { code: "TRN", label: "In Transit" },
  { code: "ARH", label: "Arrived at Hub" },
  { code: "OFD", label: "Out for Delivery" },
  { code: "DLV", label: "Delivered" },
];

const MODE_MAP = {
  air: AIR_MILESTONES,
  ocean: OCEAN_MILESTONES,
  road: ROAD_MILESTONES,
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Generate milestones for a leg with planned/actual dates and per-milestone
 * status derived from the parent leg's overall status.
 *
 * Returns: [{ code, label, planned, actual, status }]
 *   status ∈ "completed" | "current" | "delayed" | "upcoming"
 */
export function getLegMilestones(leg) {
  if (!leg) return [];
  const list = MODE_MAP[leg.mode] || ROAD_MILESTONES;
  const dep = new Date(leg.departure).getTime();
  const arr = new Date(leg.arrival).getTime();
  const span = Math.max(arr - dep, HOUR);
  const N = list.length;

  // Distribute milestone planned timestamps across the leg window.
  // First milestone = small offset before dep, last = at arrival.
  const planned = list.map((m, i) => {
    let ts;
    if (i === 0) {
      // Booking / pickup-scheduled is before the actual leg starts.
      ts = dep - Math.min(span * 0.15, DAY);
    } else if (i === N - 1) {
      ts = arr;
    } else {
      ts = dep + (span * i) / (N - 1);
    }
    return { ...m, planned: new Date(ts).toISOString() };
  });

  const now = Date.now();
  const legStatus = leg.status;

  return planned.map((m, i) => {
    const t = new Date(m.planned).getTime();
    const prevT = i > 0 ? new Date(planned[i - 1].planned).getTime() : -Infinity;

    let status = "upcoming";
    let actual = null;

    if (legStatus === "completed") {
      status = "completed";
      actual = m.planned;
    } else if (legStatus === "scheduled") {
      status = "upcoming";
    } else if (legStatus === "in_transit" || legStatus === "active") {
      if (i === N - 1) {
        // For in-transit legs, the FINAL milestone stays open until the
        // leg itself is marked completed — even if "now" is past the
        // planned timestamp (otherwise mock data with old dates would
        // visually contradict the leg's IN TRANSIT badge).
        status = prevT <= now ? "current" : "upcoming";
      } else if (t <= now) {
        status = "completed";
        actual = m.planned;
      } else if (prevT <= now) {
        status = "current";
      } else {
        status = "upcoming";
      }
    } else if (legStatus === "delayed") {
      if (i === N - 1) {
        status = prevT <= now ? "delayed" : "upcoming";
      } else if (t <= now) {
        status = "completed";
        actual = m.planned;
      } else if (prevT <= now) {
        status = "delayed";
      } else {
        status = "upcoming";
      }
    }
    return { ...m, status, actual };
  });
}

export function getMilestoneSummary(leg) {
  const ms = getLegMilestones(leg);
  const completed = ms.filter((m) => m.status === "completed").length;
  return { completed, total: ms.length, milestones: ms };
}
