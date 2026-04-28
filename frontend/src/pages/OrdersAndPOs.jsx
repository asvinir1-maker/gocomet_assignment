import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, Receipt, ExternalLink } from "lucide-react";
import { fmtDate } from "../lib/format";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmtMoney = (n) => `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function OrdersAndPOs() {
  const [tab, setTab] = useState("PO");
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [shipmentFilter, setShipmentFilter] = useState("");

  useEffect(() => {
    axios.get(`${API}/orders-docs`).then((r) => setDocs(r.data || []));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter((d) => {
      if (d.doc_type !== tab) return false;
      if (shipmentFilter && d.shipment_id.toUpperCase() !== shipmentFilter.toUpperCase()) return false;
      if (q) {
        const hay = `${d.doc_number} ${d.party} ${d.shipment_id} ${d.description || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [docs, tab, search, shipmentFilter]);

  const totals = useMemo(() => {
    const all = docs.filter((d) => d.doc_type === tab);
    return { count: all.length, value: all.reduce((acc, d) => acc + (d.value_usd || 0), 0) };
  }, [docs, tab]);

  const shipmentIds = useMemo(
    () => Array.from(new Set(docs.map((d) => d.shipment_id))).sort(),
    [docs],
  );

  return (
    <div className="bg-[#FAFAFA] min-h-screen" data-testid="orders-pos-page">
      <header className="px-6 md:px-12 pt-10 pb-6 border-b border-neutral-200 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Procurement &amp; Sales</div>
          <h1 className="font-display text-4xl lg:text-5xl tracking-tighter font-medium text-neutral-950 mt-1">Orders &amp; POs</h1>
          <p className="text-neutral-600 mt-2 max-w-2xl">
            Every Purchase Order and Sales Order, joined to its shipment. Source: ERP sync or Excel upload.
          </p>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-8">
        {/* Tabs */}
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 mb-6">
          <div className="flex items-center gap-1">
            {[
              { k: "PO", l: "Purchase Orders", Icon: ShoppingCart },
              { k: "SO", l: "Sales Orders", Icon: Receipt },
            ].map(({ k, l, Icon }) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                data-testid={`tab-${k}`}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 -mb-px transition-colors ${
                  tab === k ? "border-neutral-950 text-neutral-950" : "border-transparent text-neutral-500 hover:text-neutral-950"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium tracking-tight">{l}</span>
              </button>
            ))}
          </div>
          <Link to="/integrations" className="text-[11px] font-bold tracking-[0.18em] uppercase text-neutral-700 hover:text-neutral-950 flex items-center gap-1">
            + Import
          </Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200 mb-6">
          <div className="bg-white p-4">
            <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">{tab === "PO" ? "POs" : "SOs"}</div>
            <div className="font-display text-2xl text-neutral-950 mt-1">{totals.count}</div>
          </div>
          <div className="bg-white p-4">
            <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Combined value</div>
            <div className="font-display text-2xl text-neutral-950 mt-1">{fmtMoney(totals.value)}</div>
          </div>
          <div className="bg-white p-4">
            <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Filtered rows</div>
            <div className="font-display text-2xl text-neutral-950 mt-1">{filtered.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="border border-neutral-200 bg-white p-4 mb-4 flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doc, party, shipment, description…"
              data-testid="orders-search"
              className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 focus:border-neutral-950 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-500">Shipment</label>
            <select
              value={shipmentFilter}
              onChange={(e) => setShipmentFilter(e.target.value)}
              data-testid="orders-shipment-filter"
              className="ml-2 px-3 py-2 text-sm border border-neutral-200 font-mono"
            >
              <option value="">All shipments</option>
              {shipmentIds.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="border border-neutral-200 bg-white overflow-x-auto" data-testid="orders-table">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="bg-[#FAFAFA] border-b border-neutral-200">
              <tr>
                {["Doc #", "Party", "Shipment", "Description", "Order date", "Value", "Source"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-400">No documents match your filters.</td></tr>
              ) : filtered.map((d) => (
                <tr key={d.id} className="hover:bg-neutral-50" data-testid={`doc-row-${d.id}`}>
                  <td className="px-4 py-3 font-mono text-[12px] text-neutral-950">{d.doc_number}</td>
                  <td className="px-4 py-3 text-[13px]">{d.party}</td>
                  <td className="px-4 py-3">
                    <Link to={`/shipment/${d.shipment_id}`} className="font-mono text-[12px] text-neutral-950 hover:underline inline-flex items-center gap-1">
                      {d.shipment_id} <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-neutral-600 max-w-[280px] truncate">{d.description || "—"}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-neutral-700 whitespace-nowrap">{fmtDate(d.order_date)}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-neutral-950 whitespace-nowrap">{fmtMoney(d.value_usd)}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-neutral-500">{d.source}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
