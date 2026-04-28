import React, { useState } from "react";
import { Search, ArrowRight, Loader2 } from "lucide-react";

const examples = ["SHP-2025-1042", "SHP-2025-2081", "SHP-2025-3155", "SHP-2025-4209"];

export default function HeroSearch({ onTrack, loading }) {
  const [q, setQ] = useState("");

  const submit = (e) => {
    e?.preventDefault();
    if (!q.trim()) return;
    onTrack(q.trim());
  };

  return (
    <section data-testid="hero-section" className="relative bg-[#FAFAFA] border-b border-neutral-200 overflow-hidden">
      <div className="absolute inset-0 hero-grid pointer-events-none" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 border border-neutral-300 bg-white px-3 py-1.5 mb-8" data-testid="hero-tagline">
          <span className="w-1.5 h-1.5 bg-emerald-500" />
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-700">Unified Multimodal Visibility</span>
        </div>

        <h1 className="font-display tracking-tighter font-medium text-neutral-950 text-4xl sm:text-5xl lg:text-7xl leading-[0.95]">
          One ID. <br className="hidden sm:block" />
          The whole journey<span className="text-neutral-400">.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base md:text-lg text-neutral-600 leading-relaxed">
          Punch in any shipment ID and see every leg — road, ocean, air — stitched into a single timeline.
          No more tab-hopping across portals.
        </p>

        <form
          onSubmit={submit}
          className="w-full max-w-3xl mt-12 bg-white border border-neutral-200 shadow-xl shadow-neutral-950/5 p-6 md:p-8 fade-up"
        >
          <div className="flex items-end gap-3 border-b-2 border-neutral-950 pb-3 focus-within:border-blue-600 transition-colors">
            <Search className="w-6 h-6 text-neutral-400 mb-2" />
            <input
              data-testid="search-shipment-input"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value.toUpperCase())}
              placeholder="ENTER SHIPMENT ID"
              className="flex-1 text-2xl md:text-4xl font-mono tracking-tighter bg-transparent focus:outline-none placeholder:text-neutral-300 uppercase"
            />
            <button
              type="submit"
              data-testid="track-shipment-button"
              disabled={loading}
              className="bg-neutral-950 text-white px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Track <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-left">
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400 mr-1">Try:</span>
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => { setQ(ex); onTrack(ex); }}
                data-testid={`example-${ex}`}
                className="font-mono text-xs px-2.5 py-1 border border-neutral-200 hover:border-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </form>

        <div className="grid grid-cols-3 gap-px bg-neutral-200 mt-12 max-w-3xl w-full border border-neutral-200">
          {[
            { k: "MODES", v: "AIR · OCEAN · ROAD" },
            { k: "CARRIERS", v: "180+" },
            { k: "DATA POINTS / DAY", v: "2.4M" },
          ].map((s) => (
            <div key={s.k} className="bg-white p-4 md:p-5 text-left">
              <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">{s.k}</div>
              <div className="font-mono text-sm md:text-base text-neutral-950 mt-1.5">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
