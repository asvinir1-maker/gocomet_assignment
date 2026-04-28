import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, User2 } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function LinkedOrdersPanel({ orders }) {
  if (!orders || orders.length === 0) return null;
  return (
    <div className="mt-8 border border-neutral-200 bg-white" data-testid="linked-orders-panel">
      <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Linked Customer Orders</div>
          <div className="font-display text-xl text-neutral-950 mt-0.5">{orders.length} consignees from this consolidated shipment</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
        {orders.map((o) => (
          <Link
            key={o.order_number}
            to={`/order/${o.order_number}`}
            data-testid={`linked-order-${o.order_number}`}
            className="p-5 hover:bg-neutral-50 transition-colors group flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 border border-neutral-200 bg-neutral-50 flex items-center justify-center shrink-0">
                <User2 className="w-4 h-4 text-neutral-700" />
              </div>
              <div className="min-w-0">
                <div className="font-mono text-xs text-neutral-500">{o.order_number}</div>
                <div className="font-display font-medium text-neutral-950 truncate">{o.customer_name}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{o.product}</div>
                <div className="text-[11px] text-neutral-400 mt-1">Final destination: {o.city}</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <StatusBadge status={o.status} />
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-950" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
