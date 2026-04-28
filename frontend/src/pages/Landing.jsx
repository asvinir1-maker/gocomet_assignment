import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Filter, ArrowDownAZ } from "lucide-react";
import HeroSearch from "../components/HeroSearch";
import MultimodalTimeline from "../components/MultimodalTimeline";
import ShipmentCard from "../components/ShipmentCard";
import StatusBadge from "../components/StatusBadge";
import ViewToggle from "../components/ViewToggle";
import LinkedOrdersPanel from "../components/LinkedOrdersPanel";
import CustomerTimeline from "../components/CustomerTimeline";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Landing() {
  const [params, setParams] = useSearchParams();
  const statusFilter = params.get("status") || "all";
  const audienceParam = params.get("view");
  const [audience, setAudience] = useState(audienceParam === "customer" ? "customer" : "shipper");
  const navigate = useNavigate();
  const location = useLocation();

  // Keep local audience state in sync with URL ?view= param (so sidebar Dashboard
  // click from customer view falls back to shipper).
  useEffect(() => {
    const next = audienceParam === "customer" ? "customer" : "shipper";
    setAudience((prev) => (prev === next ? prev : next));
  }, [audienceParam]);

  // Smooth-scroll to #workspace when sidebar links use that hash.
  useEffect(() => {
    if (location.hash === "#workspace") {
      setTimeout(() => {
        document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [location.hash, location.search]);

  const [shipments, setShipments] = useState([]);
  const [tracked, setTracked] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [sort, setSort] = useState("recent");

  // sync audience -> url
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (audience === "customer") next.set("view", "customer");
    else next.delete("view");
    setParams(next, { replace: true });
    setTracked(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience]);

  // Fetch list (shipper view only)
  useEffect(() => {
    if (audience !== "shipper") { setShipments([]); setListLoading(false); return; }
    let cancelled = false;
    setListLoading(true);
    const q = { audience: "shipper" };
    if (statusFilter !== "all") q.status = statusFilter;
    axios.get(`${API}/shipments`, { params: q })
      .then((r) => { if (!cancelled) setShipments(r.data); })
      .catch(() => { if (!cancelled) toast.error("Could not load shipments"); })
      .finally(() => { if (!cancelled) setListLoading(false); });
    return () => { cancelled = true; };
  }, [statusFilter, audience]);

  const handleTrack = async (id) => {
    setLoading(true);
    setTracked(null);
    try {
      const endpoint = audience === "customer" ? "orders" : "shipments";
      const r = await axios.get(`${API}/${endpoint}/${encodeURIComponent(id)}`);
      setTracked(r.data);
      setTimeout(() => {
        document.getElementById("tracked-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      const msg = e.response?.data?.detail || "Not found";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const sorted = useMemo(() => {
    const arr = [...shipments];
    if (sort === "az") arr.sort((a, b) => a.id.localeCompare(b.id));
    if (sort === "za") arr.sort((a, b) => b.id.localeCompare(a.id));
    if (sort === "eta") arr.sort((a, b) => new Date(a.eta) - new Date(b.eta));
    return arr;
  }, [shipments, sort]);

  return (
    <div data-testid="landing-page">
      {/* View toggle bar */}
      <div className="px-6 md:px-12 pt-6 pb-2 bg-[#FAFAFA] border-b border-neutral-100 flex items-center justify-between">
        <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">
          {audience === "customer" ? "Customer Portal" : "Operations Workspace"}
        </div>
        <ViewToggle value={audience} onChange={setAudience} />
      </div>

      <HeroSearch audience={audience} onTrack={handleTrack} loading={loading} />

      {/* Tracked result */}
      {tracked && (
        <section id="tracked-result" className="px-6 md:px-12 py-12 border-b border-neutral-200 bg-white" data-testid="tracked-result-section">
          <div className="max-w-7xl mx-auto">
            {audience === "shipper" ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                  <div>
                    <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Unified Journey</div>
                    <h2 className="font-display text-3xl lg:text-4xl tracking-tight font-medium text-neutral-950 mt-1">
                      {tracked.id}
                    </h2>
                    <div className="font-mono text-sm text-neutral-500 mt-1">REF: {tracked.reference} · {tracked.consignor} → {tracked.consignee}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={tracked.status} />
                    <button
                      onClick={() => navigate(`/shipment/${tracked.id}`)}
                      data-testid="open-detail-button"
                      className="px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] uppercase border bg-white text-neutral-700 border-neutral-200 hover:border-neutral-950"
                    >Open Detail</button>
                  </div>
                </div>
                <MultimodalTimeline shipment={tracked} />
                {tracked.linked_orders && <LinkedOrdersPanel orders={tracked.linked_orders} />}
              </>
            ) : (
              <CustomerTimeline shipment={tracked} />
            )}
          </div>
        </section>
      )}

      {/* Shipper-only list */}
      {audience === "shipper" && (
        <section id="workspace" className="px-6 md:px-12 py-12 bg-white scroll-mt-6" data-testid="shipment-list-section">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8 border-b border-neutral-200 pb-6">
              <div>
                <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Workspace</div>
                <h2 className="font-display text-3xl tracking-tight font-medium text-neutral-950 mt-1">
                  {statusFilter === "all" ? "All Shipments" : statusFilter[0].toUpperCase() + statusFilter.slice(1)}
                  <span className="font-mono text-base text-neutral-400 ml-3">[{sorted.length}]</span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {[
                  { k: "all", l: "All" },
                  { k: "active", l: "Active" },
                  { k: "completed", l: "Completed" },
                  { k: "delayed", l: "Delayed" },
                ].map(t => (
                  <button
                    key={t.k}
                    onClick={() => {
                      const next = new URLSearchParams(params);
                      if (t.k === "all") next.delete("status");
                      else next.set("status", t.k);
                      setParams(next);
                    }}
                    data-testid={`filter-${t.k}`}
                    className={`px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] uppercase border transition-colors ${
                      statusFilter === t.k
                        ? "bg-neutral-950 text-white border-neutral-950"
                        : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-950"
                    }`}
                  >{t.l}</button>
                ))}
                <div className="w-px h-6 bg-neutral-200 mx-2" />
                <button
                  onClick={() => setSort(sort === "az" ? "za" : "az")}
                  data-testid="sort-toggle"
                  className="px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] uppercase border bg-white text-neutral-700 border-neutral-200 hover:border-neutral-950 flex items-center gap-1.5"
                >
                  <ArrowDownAZ className="w-3 h-3" /> {sort.toUpperCase()}
                </button>
              </div>
            </div>

            {listLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="border border-neutral-200 bg-neutral-50 h-72 animate-pulse" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="border border-dashed border-neutral-300 p-12 text-center" data-testid="empty-state">
                <Filter className="w-6 h-6 text-neutral-400 mx-auto mb-3" />
                <div className="font-display text-xl text-neutral-950">No shipments in this view</div>
                <div className="text-sm text-neutral-500 mt-1">Try clearing filters or tracking a new ID above.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="shipment-list-grid">
                {sorted.map((s) => <ShipmentCard key={s.id} s={s} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Customer mode helper section */}
      {audience === "customer" && !tracked && (
        <section className="px-6 md:px-12 py-16 bg-white" data-testid="customer-help-section">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200">
            {[
              { t: "1. Find your order #", d: "Check your TechNova order confirmation email — it starts with ORD-IN-" },
              { t: "2. Enter it above", d: "Paste your order number into the tracker. It works 24/7." },
              { t: "3. See every step", d: "Watch your laptop's full journey from Austin to your doorstep." },
            ].map((s) => (
              <div key={s.t} className="bg-white p-6">
                <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">How it works</div>
                <div className="font-display text-lg text-neutral-950 mt-2">{s.t}</div>
                <div className="text-sm text-neutral-600 mt-1">{s.d}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8 border-t border-neutral-200 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">UNIROUTE © 2025 — Track. Unified.</div>
          <div className="font-mono text-[11px] text-neutral-500">v1.1 · {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}
