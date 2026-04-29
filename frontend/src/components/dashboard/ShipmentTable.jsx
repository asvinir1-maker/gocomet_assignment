import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "../StatusBadge";
import ModeIcon from "../ModeIcon";
import { flagEmoji, fmtDate } from "../../lib/format";

const Header = ({ label, sortKey, sort, onSort, align = "left", className = "" }) => {
  const active = sort.key === sortKey;
  const SortIcon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-3 py-3 text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 cursor-pointer hover:text-neutral-950 select-none whitespace-nowrap ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
      data-testid={`th-${sortKey}`}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <SortIcon className={`w-3 h-3 ${active ? "text-neutral-950" : "text-neutral-300"}`} />
      </span>
    </th>
  );
};

export default function ShipmentTable({ rows }) {
  const [sort, setSort] = useState({ key: "eta", dir: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState(new Set());

  const onSort = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const k = sort.key;
      let av = a[k], bv = b[k];
      if (k === "eta" || k === "booking_date") { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      if (typeof av === "string") { av = av.toLowerCase(); bv = (bv || "").toLowerCase(); }
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [rows, sort]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const allSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) pageRows.forEach((r) => next.delete(r.id));
    else pageRows.forEach((r) => next.add(r.id));
    setSelected(next);
  };
  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  return (
    <div className="border border-neutral-200 bg-white" data-testid="shipment-table">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="bg-[#FAFAFA] border-b border-neutral-200 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                       className="w-3.5 h-3.5 accent-neutral-950" data-testid="select-all" />
              </th>
              <Header label="Shipment ID" sortKey="id" sort={sort} onSort={onSort} />
              <Header label="Audience" sortKey="audience" sort={sort} onSort={onSort} />
              <Header label="Origin → Destination" sortKey="origin" sort={sort} onSort={onSort} />
              <Header label="Modes" sortKey="modes" sort={sort} onSort={onSort} />
              <Header label="Status" sortKey="status" sort={sort} onSort={onSort} />
              <Header label="Progress" sortKey="progress" sort={sort} onSort={onSort} />
              <Header label="ETA" sortKey="eta" sort={sort} onSort={onSort} />
              <Header label="Delay" sortKey="delay_days" sort={sort} onSort={onSort} align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-neutral-400" data-testid="table-empty">
                  No shipments match the current filters.
                </td>
              </tr>
            ) : (
              pageRows.map((s) => {
                const isCustomer = s.audience === "customer";
                const link = isCustomer ? `/order/${s.id}` : `/shipment/${s.id}`;
                return (
                  <tr key={s.id} className="hover:bg-neutral-50" data-testid={`row-${s.id}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleOne(s.id)}
                        className="w-3.5 h-3.5 accent-neutral-950"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Link to={link} className="font-mono text-[13px] text-neutral-950 hover:underline">{s.id}</Link>
                      <div className="text-[11px] text-neutral-500">{s.reference}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold tracking-[0.18em] uppercase border ${
                        isCustomer ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-neutral-100 text-neutral-700 border-neutral-200"
                      }`}>
                        {isCustomer ? "Customer" : "Shipper"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 text-[13px] text-neutral-950">
                        <span>{flagEmoji(s.origin_country)}</span>
                        <span className="truncate max-w-[120px]">{s.origin}</span>
                        <span className="text-neutral-300">→</span>
                        <span>{flagEmoji(s.destination_country)}</span>
                        <span className="truncate max-w-[120px]">{s.destination}</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate max-w-[240px]">{s.consignor} → {s.consignee}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {s.modes.map((m, i) => <ModeIcon key={i} mode={m} size="sm" />)}
                      </div>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-3 py-3 min-w-[110px]">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-14 bg-neutral-200 relative">
                          <div className={`absolute left-0 top-0 h-full ${
                            s.status === "delayed" ? "bg-red-600" :
                            s.status === "completed" ? "bg-neutral-950" : "bg-amber-500"
                          }`} style={{ width: `${s.progress}%` }} />
                        </div>
                        <span className="font-mono text-[11px] text-neutral-700">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px] text-neutral-700 whitespace-nowrap">{fmtDate(s.eta)}</td>
                    <td className="px-3 py-3 text-right">
                      {s.delay_days > 0 ? (
                        <span className={`font-mono text-[12px] ${s.delay_days >= 7 ? "text-red-700" : "text-amber-700"}`}>
                          +{s.delay_days}d
                        </span>
                      ) : (
                        <span className="font-mono text-[12px] text-neutral-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / pagination */}
      <div className="border-t border-neutral-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-neutral-500">
          {selected.size > 0 && <span className="text-neutral-950 font-medium mr-2">{selected.size} selected · </span>}
          Showing <span className="font-mono text-neutral-900">{total === 0 ? 0 : start + 1}</span>
          –<span className="font-mono text-neutral-900">{Math.min(start + pageSize, total)}</span>
          {" "}of <span className="font-mono text-neutral-900">{total}</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500">
            Per page
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              data-testid="page-size"
              className="ml-2 border border-neutral-200 px-2 py-1 text-xs font-mono bg-white"
            >
              {[5, 10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              data-testid="page-prev"
              className="p-1.5 border border-neutral-200 disabled:opacity-30 hover:border-neutral-950"
            ><ChevronLeft className="w-3.5 h-3.5" /></button>
            <div className="font-mono text-xs text-neutral-700 px-2">{safePage} / {totalPages}</div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              data-testid="page-next"
              className="p-1.5 border border-neutral-200 disabled:opacity-30 hover:border-neutral-950"
            ><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
