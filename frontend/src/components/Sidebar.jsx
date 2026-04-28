import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Activity, Settings,
  Globe2, FileSearch, Plug, Receipt,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Sidebar() {
  const loc = useLocation();
  const [shipperCount, setShipperCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios.get(`${API}/shipments`, { params: { audience: "shipper" } })
      .then((r) => { if (!cancelled) setShipperCount((r.data || []).length); })
      .catch(() => { if (!cancelled) setShipperCount(0); });
    return () => { cancelled = true; };
  }, [loc.pathname]);

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", testid: "nav-dashboard" },
    { label: "All Shipments", icon: Globe2, href: "/#workspace", testid: "nav-all", badge: shipperCount },
    { label: "Reverse Search", icon: FileSearch, href: "/reverse-search", testid: "nav-reverse-search" },
    { label: "Integrations", icon: Plug, href: "/integrations", testid: "nav-integrations" },
    { label: "Orders & POs", icon: Receipt, href: "/orders-pos", testid: "nav-orders-pos" },
  ];

  return (
    <aside
      data-testid="sidebar-nav"
      className="fixed left-0 top-0 h-screen w-64 border-r border-neutral-200 bg-[#FAFAFA] flex flex-col pt-8 pb-6 px-4 z-40"
    >
      <Link to="/" className="px-3 mb-10 flex items-center gap-2.5" data-testid="brand-logo">
        <div className="w-8 h-8 bg-neutral-950 flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display font-bold text-lg tracking-tight text-neutral-950">UNIROUTE</span>
          <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 mt-0.5">Track. Unified.</span>
        </div>
      </Link>

      <div className="px-3 mb-3 text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Workspace</div>
      <nav className="flex flex-col gap-0.5">
        {navItems.map((it) => {
          const Icon = it.icon;
          const active = loc.search.includes(it.href.split("?")[1] || "##");
          const showBadge = it.badge !== undefined && it.badge !== null;
          return (
            <Link
              key={it.label}
              to={it.href}
              data-testid={it.testid}
              className={`group flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-neutral-950 text-white" : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4" strokeWidth={2} />
                <span className="font-medium">{it.label}</span>
              </span>
              {showBadge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 ${
                  active ? "bg-white/15 text-white" : "bg-neutral-200 text-neutral-700"
                }`}>{it.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-neutral-200 pt-4 px-3 flex flex-col gap-3">
        <button className="flex items-center gap-2 text-xs text-neutral-600 hover:text-neutral-950" data-testid="settings-btn">
          <Settings className="w-3.5 h-3.5" /> Settings
        </button>
        <div className="border border-neutral-200 bg-white p-3">
          <div className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-400">Plan</div>
          <div className="font-mono text-sm text-neutral-950 mt-1">ENTERPRISE</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Unlimited shipments</div>
        </div>
      </div>
    </aside>
  );
}
