import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Activity, PackageCheck, Hourglass, Truck,
  Star, AlertCircle, Trash2, Settings, Globe2,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", testid: "nav-dashboard" },
  { label: "All Shipments", icon: Globe2, href: "/", testid: "nav-all", badge: "4" },
  { label: "In Transit", icon: Truck, href: "/?status=active", testid: "nav-transit", badge: "2" },
  { label: "Completed", icon: PackageCheck, href: "/?status=completed", testid: "nav-completed", badge: "1" },
  { label: "Delayed", icon: AlertCircle, href: "/?status=delayed", testid: "nav-delayed", badge: "1" },
  { label: "Yet to Start", icon: Hourglass, href: "/?status=scheduled", testid: "nav-scheduled" },
  { label: "Starred", icon: Star, href: "/", testid: "nav-starred" },
  { label: "Deleted", icon: Trash2, href: "/", testid: "nav-deleted" },
];

export default function Sidebar() {
  const loc = useLocation();
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
              {it.badge && (
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
