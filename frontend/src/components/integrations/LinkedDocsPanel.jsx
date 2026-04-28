import React from "react";
import { Link } from "react-router-dom";
import { Receipt, ShoppingCart, ArrowUpRight } from "lucide-react";

const fmtMoney = (n) => `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function LinkedDocsPanel({ docs }) {
  if (!docs || docs.length === 0) return null;
  const pos = docs.filter((d) => d.doc_type === "PO");
  const sos = docs.filter((d) => d.doc_type === "SO");
  const totalValue = docs.reduce((acc, d) => acc + (d.value_usd || 0), 0);

  const Block = ({ title, items, Icon }) => (
    <div className="flex flex-col">
      <div className="px-5 py-3 border-b border-neutral-200 flex items-center justify-between bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-neutral-700" />
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-700">{title}</span>
          <span className="font-mono text-[11px] text-neutral-400">[{items.length}]</span>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-4 text-xs text-neutral-400">No {title.toLowerCase()} linked.</div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((d) => (
            <li key={d.id} className="px-5 py-3 flex items-start justify-between gap-3" data-testid={`linked-doc-${d.id}`}>
              <div className="min-w-0">
                <div className="font-mono text-[12px] text-neutral-950">{d.doc_number}</div>
                <div className="text-sm text-neutral-700 truncate">{d.party}</div>
                {d.description && <div className="text-[11px] text-neutral-500 truncate">{d.description}</div>}
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-[12px] text-neutral-950">{fmtMoney(d.value_usd)}</div>
                <div className="text-[10px] tracking-[0.18em] uppercase font-bold text-neutral-400">{d.source}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="mt-8 border border-neutral-200 bg-white" data-testid="linked-docs-panel">
      <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Linked PO / SO</div>
          <div className="font-display text-xl text-neutral-950 mt-0.5">{docs.length} document{docs.length === 1 ? "" : "s"} from your ERP / uploads</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Combined value</div>
          <div className="font-mono text-lg text-neutral-950 mt-0.5">{fmtMoney(totalValue)}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
        <Block title="Purchase Orders" items={pos} Icon={ShoppingCart} />
        <Block title="Sales Orders" items={sos} Icon={Receipt} />
      </div>
      <div className="px-6 py-3 border-t border-neutral-200 flex justify-end">
        <Link
          to="/orders-pos"
          className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-700 hover:text-neutral-950 flex items-center gap-1"
          data-testid="open-orders-page"
        >
          Open Orders &amp; POs <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
