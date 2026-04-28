// LocalStorage helpers for filter preferences and named presets.
const PRESETS_KEY = "uniroute.dashboard.presets.v1";
const LAST_KEY    = "uniroute.dashboard.last.v1";

const safeParse = (s, fallback) => {
  try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
};

export const loadPresets = () => safeParse(localStorage.getItem(PRESETS_KEY), []);

export const savePreset = (name, filters) => {
  const presets = loadPresets();
  const id = `p_${Date.now().toString(36)}`;
  const next = [...presets, { id, name, filters, createdAt: new Date().toISOString() }];
  localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
  return next;
};

export const deletePreset = (id) => {
  const next = loadPresets().filter((p) => p.id !== id);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
  return next;
};

export const loadLastFilters = () => safeParse(localStorage.getItem(LAST_KEY), null);

export const persistLastFilters = (filters) => {
  localStorage.setItem(LAST_KEY, JSON.stringify(filters));
};

export const DEFAULT_FILTERS = {
  search: "",
  status: [],          // empty = all
  modes: [],
  audience: "all",     // all | shipper | customer
  origins: [],
  destinations: [],
  carriers: [],
  delayedOverDays: 0,  // 0 = no filter
};
