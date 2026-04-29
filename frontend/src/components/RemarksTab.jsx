import React, { useState, useMemo } from "react";
import { Lock, Globe, Plus, Trash2, MessageSquare, Filter, ChevronDown } from "lucide-react";
import { roleColor, deleteRemark } from "../lib/remarksApi";
import { fmtDateTime } from "../lib/format";
import AddRemarkDialog from "./AddRemarkDialog";
import { toast } from "sonner";

export default function RemarksTab({ shipment, remarks, onChanged }) {
  const [filterVis, setFilterVis] = useState("all"); // all | internal | public
  const [filterLeg, setFilterLeg] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const legs = (shipment && shipment.legs) || [];

  const filtered = useMemo(() => {
    return remarks.filter((r) => {
      if (filterVis !== "all" && r.visibility !== filterVis) return false;
      if (filterLeg !== "all" && r.leg_id !== filterLeg) return false;
      if (filterRole !== "all" && r.author_role !== filterRole) return false;
      return true;
    });
  }, [remarks, filterVis, filterLeg, filterRole]);

  const counts = useMemo(() => ({
    all: remarks.length,
    internal: remarks.filter((r) => r.visibility === "internal").length,
    public: remarks.filter((r) => r.visibility === "public").length,
  }), [remarks]);

  const roles = useMemo(() => {
    const set = new Set(remarks.map((r) => r.author_role));
    return Array.from(set).sort();
  }, [remarks]);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this remark? This can't be undone.")) return;
    try {
      await deleteRemark(id);
      toast.success("Remark removed");
      onChanged && onChanged();
    } catch {
      toast.error("Failed to remove");
    }
  };

  return (
    <div data-testid="remarks-tab" className="fade-up">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1 bg-neutral-100 p-1">
          <FilterPill label="All" count={counts.all} active={filterVis === "all"} onClick={() => setFilterVis("all")} testid="vis-all" />
          <FilterPill
            label={<><Lock className="w-3 h-3" /> Internal</>}
            count={counts.internal}
            active={filterVis === "internal"}
            onClick={() => setFilterVis("internal")}
            testid="vis-internal"
          />
          <FilterPill
            label={<><Globe className="w-3 h-3" /> Public</>}
            count={counts.public}
            active={filterVis === "public"}
            onClick={() => setFilterVis("public")}
            testid="vis-public"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            data-testid="toggle-filters"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-neutral-300 hover:border-neutral-700"
          >
            <Filter className="w-3 h-3" /> Filters
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          <AddRemarkDialog
            shipmentId={shipment.id}
            shipment={shipment}
            onAdded={onChanged}
            trigger={
              <button data-testid="add-remark-btn" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-950 text-white hover:bg-neutral-800">
                <Plus className="w-3 h-3" /> New Remark
              </button>
            }
          />
        </div>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="mb-4 p-3 border border-neutral-200 bg-neutral-50 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Filter by Leg</label>
            <select value={filterLeg} onChange={(e) => setFilterLeg(e.target.value)} className="w-full text-sm px-2 py-1.5 border border-neutral-300 bg-white">
              <option value="all">All legs</option>
              {legs.map((l) => (
                <option key={l.leg_id} value={l.leg_id}>
                  Leg {l.sequence} · {l.mode.toUpperCase()} · {l.from_location} → {l.to_location}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Filter by Role</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full text-sm px-2 py-1.5 border border-neutral-300 bg-white">
              <option value="all">All roles</option>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="border border-dashed border-neutral-300 p-12 text-center">
          <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <div className="font-display text-lg text-neutral-700">No remarks yet</div>
          <div className="text-sm text-neutral-500 mt-1">
            {remarks.length === 0
              ? "Be the first to post an update on this shipment."
              : "No remarks match the current filters."}
          </div>
        </div>
      ) : (
        <div className="space-y-3" data-testid="remarks-list">
          {filtered.map((r) => (
            <RemarkItem key={r.id} remark={r} legs={legs} onDelete={() => handleDelete(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, count, active, onClick, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors ${
        active ? "bg-white shadow-sm text-neutral-950" : "text-neutral-600 hover:text-neutral-950"
      }`}
    >
      {label}
      <span className={`font-mono text-[10px] ${active ? "text-neutral-500" : "text-neutral-400"}`}>{count}</span>
    </button>
  );
}

function RemarkItem({ remark, legs, onDelete }) {
  const leg = legs.find((l) => l.leg_id === remark.leg_id);
  const isPublic = remark.visibility === "public";

  return (
    <div
      data-testid={`remark-${remark.id}`}
      className={`border bg-white p-4 ${isPublic ? "border-l-4 border-l-emerald-500 border-y-neutral-200 border-r-neutral-200" : "border-neutral-200"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar bubble */}
          <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {(remark.author_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-medium text-neutral-950">{remark.author_name}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 border tracking-wider uppercase ${roleColor(remark.author_role)}`}>
                {remark.author_role}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 border flex items-center gap-1 tracking-wider uppercase ${
                isPublic
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-neutral-100 text-neutral-700 border-neutral-300"
              }`}>
                {isPublic ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                {remark.visibility}
              </span>
            </div>

            <div className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">{remark.message}</div>

            <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-neutral-500">
              <span>{fmtDateTime(remark.created_at)}</span>
              {leg && (
                <span className="flex items-center gap-1">
                  · Leg {leg.sequence} {leg.mode.toUpperCase()}
                </span>
              )}
              {remark.milestone_code && (
                <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 text-neutral-700">
                  {remark.milestone_code}
                </span>
              )}
              {!leg && !remark.milestone_code && (
                <span className="text-neutral-400 italic">whole shipment</span>
              )}
            </div>
          </div>
        </div>

        <button
          data-testid={`delete-remark-${remark.id}`}
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 hover:bg-red-50 p-1.5 text-red-600 transition-opacity"
          aria-label="Delete remark"
          style={{ opacity: 0.6 }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
