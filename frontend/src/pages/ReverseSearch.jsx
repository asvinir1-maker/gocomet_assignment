import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Search, ArrowRight, Loader2, FileSearch, Ship, Plane, Layers } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "../components/StatusBadge";
import ModeIcon, { modeMeta } from "../components/ModeIcon";
import { fmtDate, flagEmoji, fmtDateTime } from "../lib/format";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EXAMPLES = [
  { q: "MAEU-547W-9821044", label: "B/L · Maersk (TechNova)" },
  { q: "020-77881664",       label: "AWB · Lufthansa Cargo" },
  { q: "MEDU-118E-3320915",  label: "B/L · MSC (Mumbai → Rotterdam)" },
  { q: "ONEY-022S-4421809",  label: "B/L · ONE (Singapore → Sydney)" },
];

const fieldLabel = {
  bl_number:   "Bill of Lading",
  awb_number:  "Air Waybill",
  vehicle_ref: "Vehicle / Voyage / Flight",
};

function MatchCard({ m }) {
  const link = m.audience === "customer" ? `/order/${m.shipment_id}` : `/shipment/${m.shipment_id}`;
  const meta = modeMeta[m.matched_leg.mode];
  return (
    <Link
      to={link}
      data-testid={`match-${m.shipment_id}`}
      className="block border border-neutral-200 bg-white hover:border-neutral-950 hover:shadow-lg transition-all p-6 group"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold tracking-[0.18em] uppercase border ${
              m.audience === "customer" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-neutral-100 text-neutral-700 border-neutral-200"
            }`}>{m.audience}</span>
            <span className="font-mono text-[11px] text-neutral-500">REF: {m.reference}</span>
          </div>
          <div className="font-display text-2xl font-medium text-neutral-950">{m.shipment_id}</div>
          <div className="font-mono text-xs text-neutral-500 mt-0.5">{m.consignor} → {m.consignee}</div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <StatusBadge status={m.status} />
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">ETA {fmtDate(m.eta)}</div>
        </div>
      </div>

      {/* Origin → Destination strip */}
      <div className="flex items-center gap-3 text-sm text-neutral-700 border-t border-neutral-100 pt-4">
        <span>{flagEmoji(m.origin_country)}</span>
        <span className="truncate">{m.origin}</span>
        <span className="text-neutral-300">→</span>
        <span>{flagEmoji(m.destination_country)}</span>
        <span className="truncate">{m.destination}</span>
        <div className="ml-auto flex items-center gap-1">
          {m.modes.map((mode, i) => <ModeIcon key={i} mode={mode} size="sm" />)}
        </div>
      </div>

      {/* Matched leg highlight */}
      <div className={`mt-4 ${meta.bg} border ${meta.border} p-4`}>
        <div className="flex items-start gap-3">
          <ModeIcon mode={m.matched_leg.mode} size="md" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-500 flex items-center gap-2">
              Matched on <span className="text-neutral-950">{fieldLabel[m.matched_field]}</span>
              <span className={`text-[9px] font-bold tracking-[0.18em] uppercase border px-1.5 py-0.5 bg-white ${meta.text} ${meta.border}`}>
                Leg {m.matched_leg.sequence}
              </span>
            </div>
            <div className="font-display font-medium text-neutral-950 mt-1.5">{m.matched_leg.carrier}</div>
            <div className="font-mono text-[12px] text-neutral-700">{m.matched_leg.vehicle_ref}</div>
            {m.matched_leg.bl_number && (
              <div className="font-mono text-[11px] text-neutral-600 mt-1">B/L: <span className="text-neutral-950">{m.matched_leg.bl_number}</span></div>
            )}
            {m.matched_leg.awb_number && (
              <div className="font-mono text-[11px] text-neutral-600 mt-1">AWB: <span className="text-neutral-950">{m.matched_leg.awb_number}</span></div>
            )}
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-neutral-600">
              <div>
                <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">From</div>
                <div className="text-neutral-950">{m.matched_leg.from_location}</div>
                <div className="font-mono text-[11px] text-neutral-500">{fmtDateTime(m.matched_leg.departure)}</div>
              </div>
              <div>
                <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">To</div>
                <div className="text-neutral-950">{m.matched_leg.to_location}</div>
                <div className="font-mono text-[11px] text-neutral-500">{fmtDateTime(m.matched_leg.arrival)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="font-mono text-[11px] text-neutral-500">Progress: {m.progress}%</div>
        <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-700 group-hover:text-neutral-950 flex items-center gap-1">
          Open full journey <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

export default function ReverseSearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e, override) => {
    e?.preventDefault?.();
    const query = (override ?? q).trim();
    if (!query) { toast.error("Enter a B/L or AWB"); return; }
    setQ(query);
    setLoading(true); setResult(null); setError(null);
    try {
      const r = await axios.get(`${API}/reverse-search`, { params: { q: query } });
      setResult(r.data);
      if (r.data.count === 0) toast.error("No shipments matched that reference");
    } catch (e) {
      setError(e.response?.data?.detail || "Search failed");
    } finally { setLoading(false); }
  };

  return (
    <div data-testid="reverse-search-page" className="bg-[#FAFAFA] min-h-screen">
      {/* Hero */}
      <header className="relative border-b border-neutral-200 bg-[#FAFAFA] overflow-hidden">
        <div className="absolute inset-0 hero-grid pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 border border-neutral-300 bg-white px-3 py-1.5 mb-6">
            <FileSearch className="w-3.5 h-3.5 text-neutral-700" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-700">Reverse Search</span>
          </div>
          <h1 className="font-display tracking-tighter font-medium text-neutral-950 text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
            One B/L. <br className="hidden sm:block" />Every shipment.
          </h1>
          <p className="mt-5 max-w-2xl text-base md:text-lg text-neutral-600 leading-relaxed">
            Enter an Air Waybill (AWB) or Bill of Lading (B/L). We'll surface every shipment riding on that document — including consolidated cargo split across multiple consignees.
          </p>

          <form
            onSubmit={submit}
            className="w-full max-w-3xl mt-10 bg-white border border-neutral-200 shadow-xl shadow-neutral-950/5 p-6 md:p-8 fade-up"
          >
            <div className="flex items-end gap-3 border-b-2 border-neutral-950 pb-3 focus-within:border-blue-600 transition-colors">
              <Search className="w-6 h-6 text-neutral-400 mb-2" />
              <input
                data-testid="reverse-search-input"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value.toUpperCase())}
                placeholder="ENTER AWB OR B/L"
                className="flex-1 text-2xl md:text-3xl font-mono tracking-tighter bg-transparent focus:outline-none placeholder:text-neutral-300 uppercase"
              />
              <button
                type="submit"
                data-testid="reverse-search-button"
                disabled={loading}
                className="bg-neutral-950 text-white px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Search <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-left">
              <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400 mr-1">Try:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.q}
                  type="button"
                  onClick={(e) => submit(e, ex.q)}
                  data-testid={`reverse-example-${ex.q}`}
                  className="font-mono text-[11px] px-2.5 py-1 border border-neutral-200 hover:border-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors"
                  title={ex.label}
                >
                  {ex.q}
                </button>
              ))}
            </div>
          </form>
        </div>
      </header>

      {/* Results */}
      <section className="px-6 md:px-12 py-12">
        <div className="max-w-5xl mx-auto">
          {!result && !loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200">
              {[
                { Icon: Ship,   t: "Bill of Lading",     d: "Ocean B/Ls cover full vessel/voyage. One B/L often covers many consignees." },
                { Icon: Plane,  t: "Air Waybill",        d: "Each AWB is a single air-leg contract. Match the carrier prefix + serial." },
                { Icon: Layers, t: "Consolidated cargo", d: "If multiple shipments share a B/L, you'll see them all — drill into any one." },
              ].map(({ Icon, t, d }) => (
                <div key={t} className="bg-white p-6">
                  <Icon className="w-5 h-5 text-neutral-700" />
                  <div className="font-display font-medium text-lg text-neutral-950 mt-3">{t}</div>
                  <div className="text-sm text-neutral-600 mt-1">{d}</div>
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 text-neutral-500 py-20 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Searching across all shipments…
            </div>
          )}

          {error && !loading && (
            <div className="border border-red-200 bg-red-50 p-8">
              <div className="font-display text-xl text-red-700">Search error</div>
              <div className="text-sm text-red-600 mt-1">{error}</div>
            </div>
          )}

          {result && !loading && (
            <div data-testid="reverse-search-results">
              <div className="flex flex-wrap items-end justify-between gap-3 mb-6 border-b border-neutral-200 pb-4">
                <div>
                  <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Results for</div>
                  <div className="font-mono text-xl text-neutral-950 mt-0.5">{result.query}</div>
                </div>
                <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-700">
                  <span className="font-mono text-2xl text-neutral-950 mr-2">{result.count}</span>
                  shipment{result.count === 1 ? "" : "s"} matched
                </div>
              </div>

              {result.count === 0 ? (
                <div className="border border-dashed border-neutral-300 p-10 text-center text-neutral-500" data-testid="reverse-no-match">
                  <FileSearch className="w-6 h-6 text-neutral-400 mx-auto mb-3" />
                  No shipments are riding on this document yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {result.matches.map((m) => <MatchCard key={m.shipment_id} m={m} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
