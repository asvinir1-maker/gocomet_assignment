import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Layers, Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import KpiCard from "../components/dashboard/KpiCard";
import FilterRail from "../components/dashboard/FilterRail";
import FilterPresets from "../components/dashboard/FilterPresets";
import ShipmentTable from "../components/dashboard/ShipmentTable";
import {
  DEFAULT_FILTERS, loadPresets, savePreset, deletePreset,
  loadLastFilters, persistLastFilters,
} from "../lib/preferences";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(loadLastFilters() || DEFAULT_FILTERS);
  const [presets, setPresets] = useState(loadPresets());

  // Fetch ALL shipments (both audiences). Filtering done client-side for scalability up to thousands.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios.get(`${API}/shipments`)
      .then((r) => { if (!cancelled) setShipments(r.data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Persist filters
  useEffect(() => { persistLastFilters(filters); }, [filters]);

  // Available filter options (derived from data)
  const options = useMemo(() => {
    const origins = Array.from(new Set(shipments.map((s) => s.origin_country))).sort();
    const destinations = Array.from(new Set(shipments.map((s) => s.destination_country))).sort();
    const carriers = Array.from(new Set(
      shipments.flatMap((s) => (s.legs || []).map((l) => l.carrier))
    )).sort();
    return { origins, destinations, carriers };
  }, [shipments]);

  // Apply all filters
  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return shipments.filter((s) => {
      if (filters.audience !== "all" && (s.audience || "shipper") !== filters.audience) return false;
      if (filters.status.length && !filters.status.includes(s.status)) return false;
      if (filters.modes.length && !filters.modes.some((m) => s.modes.includes(m))) return false;
      if (filters.origins.length && !filters.origins.includes(s.origin_country)) return false;
      if (filters.destinations.length && !filters.destinations.includes(s.destination_country)) return false;
      if (filters.carriers.length) {
        const carriers = (s.legs || []).map((l) => l.carrier);
        if (!filters.carriers.some((c) => carriers.includes(c))) return false;
      }
      if (filters.delayedOverDays > 0 && (s.delay_days || 0) < filters.delayedOverDays) return false;
      if (q) {
        const hay = `${s.id} ${s.reference} ${s.consignor} ${s.consignee} ${s.origin} ${s.destination}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [shipments, filters]);

  // Counts for filter chips/badges (computed on the *unfiltered* dataset so users see scope)
  const counts = useMemo(() => {
    const byStatus = {}, byMode = {}, byOrigin = {}, byDestination = {}, byCarrier = {};
    for (const s of shipments) {
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
      for (const m of s.modes) byMode[m] = (byMode[m] || 0) + 1;
      byOrigin[s.origin_country] = (byOrigin[s.origin_country] || 0) + 1;
      byDestination[s.destination_country] = (byDestination[s.destination_country] || 0) + 1;
      for (const l of s.legs || []) byCarrier[l.carrier] = (byCarrier[l.carrier] || 0) + 1;
    }
    return { byStatus, byMode, byOrigin, byDestination, byCarrier };
  }, [shipments]);

  // KPIs computed on filtered set
  const kpis = useMemo(() => {
    const total = filtered.length;
    const inTransit = filtered.filter((s) => s.status === "active").length;
    const completed = filtered.filter((s) => s.status === "completed").length;
    const delayed = filtered.filter((s) => s.status === "delayed").length;
    const delayedOver7 = filtered.filter((s) => (s.delay_days || 0) >= 7).length;
    const avgProgress = total === 0 ? 0 : Math.round(filtered.reduce((acc, s) => acc + (s.progress || 0), 0) / total);
    return { total, inTransit, completed, delayed, delayedOver7, avgProgress };
  }, [filtered]);

  // Preset handlers
  const handleSave = (name) => setPresets(savePreset(name, filters));
  const handleDelete = (id) => setPresets(deletePreset(id));
  const handleApply = (f) => setFilters({ ...DEFAULT_FILTERS, ...f });
  const handleClearAll = () => setFilters(DEFAULT_FILTERS);

  return (
    <div className="bg-[#FAFAFA] min-h-screen" data-testid="dashboard-page">
      {/* Header */}
      <header className="px-6 md:px-12 pt-10 pb-6 border-b border-neutral-200 bg-white">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Operations</div>
          <h1 className="font-display text-4xl lg:text-5xl tracking-tighter font-medium text-neutral-950 mt-1">Dashboard</h1>
          <p className="text-neutral-600 mt-2 max-w-2xl">
            All shipments and customer orders in one filterable view. Save your favorite filter combinations as presets — they persist across sessions.
          </p>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-8">
        {/* KPI Row */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-neutral-200 border border-neutral-200 mb-8" data-testid="kpi-row">
          <KpiCard testid="kpi-total" label="Total" value={kpis.total} sub="matching filters" Icon={Layers} />
          <KpiCard testid="kpi-in-transit" label="In Transit" value={kpis.inTransit} sub={`${kpis.total ? Math.round((kpis.inTransit/kpis.total)*100) : 0}% of set`} Icon={Activity} tone="warning" />
          <KpiCard testid="kpi-completed" label="Completed" value={kpis.completed} sub="delivered" Icon={CheckCircle2} tone="success" />
          <KpiCard testid="kpi-delayed" label="Delayed" value={kpis.delayed} sub="any delay" Icon={Clock} tone="warning" />
          <KpiCard testid="kpi-delayed-7" label="Delayed > 7d" value={kpis.delayedOver7} sub={`avg progress ${kpis.avgProgress}%`} Icon={AlertTriangle} tone="danger" />
        </section>

        {/* Body grid: Filter rail + Table */}
        <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] gap-6 items-start">
          <div className="flex flex-col gap-4">
            <FilterPresets
              presets={presets}
              currentFilters={filters}
              onApply={handleApply}
              onSave={handleSave}
              onDelete={handleDelete}
            />
            <FilterRail
              filters={filters}
              setFilters={setFilters}
              options={options}
              counts={counts}
              onClear={handleClearAll}
            />
          </div>

          <div>
            {loading ? (
              <div className="border border-neutral-200 bg-white p-12 text-center text-neutral-400">Loading shipments…</div>
            ) : (
              <ShipmentTable rows={filtered} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
