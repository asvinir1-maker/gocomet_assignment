import React, { useState } from "react";
import { Loader2, Send, Lock, Globe } from "lucide-react";
import { addRemark, STAKEHOLDER_ROLES } from "../lib/remarksApi";
import { toast } from "sonner";

export default function AddRemarkDialog({
  shipmentId,
  shipment,
  defaultLegId = null,
  defaultMilestoneCode = null,
  onAdded,
  trigger,
}) {
  const [open, setOpen] = useState(false);
  const [author, setAuthor] = useState(localStorage.getItem("uniroute-rmk-author") || "");
  const [role, setRole] = useState(localStorage.getItem("uniroute-rmk-role") || "Operations Manager");
  const [legId, setLegId] = useState(defaultLegId || "");
  const [milestoneCode, setMilestoneCode] = useState(defaultMilestoneCode || "");
  const [visibility, setVisibility] = useState("internal");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setMessage("");
    setMilestoneCode(defaultMilestoneCode || "");
    setLegId(defaultLegId || "");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!author.trim() || !message.trim()) {
      toast.error("Author and message are required");
      return;
    }
    setSaving(true);
    try {
      const created = await addRemark(shipmentId, {
        leg_id: legId || null,
        milestone_code: milestoneCode || null,
        author_name: author.trim(),
        author_role: role,
        visibility,
        message: message.trim(),
      });
      localStorage.setItem("uniroute-rmk-author", author.trim());
      localStorage.setItem("uniroute-rmk-role", role);
      toast.success(`Remark posted (${visibility})`);
      reset();
      setOpen(false);
      onAdded && onAdded(created);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to post");
    } finally {
      setSaving(false);
    }
  };

  // Build milestone options from shipment legs
  const legs = (shipment && shipment.legs) || [];
  const selectedLeg = legs.find((l) => l.leg_id === legId);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div
          data-testid="add-remark-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <form
            onSubmit={submit}
            className="bg-white border border-neutral-200 w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
          >
            <div className="px-6 py-4 border-b border-neutral-200 flex items-start justify-between">
              <div>
                <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Stakeholder Communication</div>
                <h3 className="font-display text-xl font-medium text-neutral-950 mt-0.5">Post a Remark</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-700 text-2xl leading-none">×</button>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Your Name</label>
                  <input
                    data-testid="rmk-author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full text-sm px-2 py-1.5 border border-neutral-300 focus:border-neutral-950 outline-none"
                    placeholder="e.g., Mei Lin"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Your Role</label>
                  <select
                    data-testid="rmk-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full text-sm px-2 py-1.5 border border-neutral-300 focus:border-neutral-950 outline-none bg-white"
                  >
                    {STAKEHOLDER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Attach to Leg (optional)</label>
                  <select
                    data-testid="rmk-leg"
                    value={legId}
                    onChange={(e) => { setLegId(e.target.value); setMilestoneCode(""); }}
                    className="w-full text-sm px-2 py-1.5 border border-neutral-300 focus:border-neutral-950 outline-none bg-white"
                  >
                    <option value="">— Whole shipment —</option>
                    {legs.map((l) => (
                      <option key={l.leg_id} value={l.leg_id}>
                        Leg {l.sequence}: {l.mode.toUpperCase()} · {l.from_location} → {l.to_location}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Milestone Code (optional)</label>
                  <input
                    data-testid="rmk-milestone"
                    value={milestoneCode}
                    onChange={(e) => setMilestoneCode(e.target.value.toUpperCase().slice(0, 6))}
                    className="w-full text-sm px-2 py-1.5 border border-neutral-300 focus:border-neutral-950 outline-none font-mono"
                    placeholder="e.g., DEP, ARR, CCL"
                    disabled={!legId}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Visibility</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-testid="rmk-vis-internal"
                    onClick={() => setVisibility("internal")}
                    className={`flex items-center gap-2 p-2.5 border text-left transition-colors ${
                      visibility === "internal" ? "border-neutral-950 bg-neutral-50" : "border-neutral-200 bg-white hover:border-neutral-400"
                    }`}
                  >
                    <Lock className="w-4 h-4 text-neutral-700" />
                    <div>
                      <div className="text-sm font-medium text-neutral-950">Internal</div>
                      <div className="text-[10px] text-neutral-500">Visible only to ops team</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    data-testid="rmk-vis-public"
                    onClick={() => setVisibility("public")}
                    className={`flex items-center gap-2 p-2.5 border text-left transition-colors ${
                      visibility === "public" ? "border-emerald-600 bg-emerald-50" : "border-neutral-200 bg-white hover:border-neutral-400"
                    }`}
                  >
                    <Globe className="w-4 h-4 text-emerald-700" />
                    <div>
                      <div className="text-sm font-medium text-neutral-950">Public</div>
                      <div className="text-[10px] text-neutral-500">Customer can see this</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Message</label>
                <textarea
                  data-testid="rmk-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full text-sm px-2 py-2 border border-neutral-300 focus:border-neutral-950 outline-none resize-none"
                  placeholder="Type your remark or update here..."
                />
                {selectedLeg && (
                  <div className="text-[11px] text-neutral-500 mt-1 font-mono">
                    Posting against Leg {selectedLeg.sequence} ({selectedLeg.mode.toUpperCase()})
                    {milestoneCode && ` · ${milestoneCode}`}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-950">Cancel</button>
              <button
                data-testid="rmk-submit"
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-neutral-950 text-white hover:bg-neutral-800 disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Post Remark
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
