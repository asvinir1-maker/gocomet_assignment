import React, { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { addCustomMilestone } from "../lib/templatesApi";
import { PHASES, phaseKeyToPct } from "../lib/phases";
import { toast } from "sonner";

export default function AddCustomMilestoneDialog({ shipmentId, leg, onAdded, trigger }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [phase, setPhase] = useState("mid");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setCode("");
    setLabel("");
    setPhase("mid");
    setNotes("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !label.trim()) {
      toast.error("Code and label are required");
      return;
    }
    setSaving(true);
    try {
      const created = await addCustomMilestone(shipmentId, leg.leg_id, {
        code: code.trim().toUpperCase().slice(0, 6),
        label: label.trim(),
        offset_pct: phaseKeyToPct(phase),
        notes: notes.trim() || null,
      });
      toast.success(`Added "${created.label}"`);
      reset();
      setOpen(false);
      onAdded && onAdded(created);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to add milestone");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div
          data-testid="add-milestone-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <form
            onSubmit={submit}
            className="bg-white border border-neutral-200 w-full max-w-md p-6 shadow-xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Custom Milestone</div>
                <h3 className="font-display text-xl font-medium text-neutral-950 mt-1">
                  Add to Leg {leg.sequence}
                </h3>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {leg.from_location} → {leg.to_location}
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-700 text-xl leading-none">×</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Code</label>
                  <input
                    data-testid="cm-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="INSP"
                    className="w-full font-mono text-sm px-2 py-1.5 border border-neutral-300 focus:border-neutral-950 outline-none"
                    maxLength={6}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Label</label>
                  <input
                    data-testid="cm-label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Customs Random Inspection"
                    className="w-full text-sm px-2 py-1.5 border border-neutral-300 focus:border-neutral-950 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">
                  When in this leg
                </label>
                <select
                  data-testid="cm-phase"
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  className="w-full text-sm px-2 py-1.5 border border-neutral-300 focus:border-neutral-950 outline-none bg-white"
                >
                  {PHASES.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Notes (optional)</label>
                <textarea
                  data-testid="cm-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full text-sm px-2 py-1.5 border border-neutral-300 focus:border-neutral-950 outline-none resize-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-950">Cancel</button>
              <button
                data-testid="cm-submit"
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-neutral-950 text-white hover:bg-neutral-800 disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Milestone
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
