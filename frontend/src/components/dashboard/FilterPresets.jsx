import React, { useState } from "react";
import { Bookmark, Plus, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function FilterPresets({ presets, currentFilters, onApply, onSave, onDelete }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Give the preset a name first");
      return;
    }
    onSave(name.trim());
    toast.success(`Saved "${name.trim()}"`);
    setName("");
    setOpen(false);
  };

  return (
    <div className="border border-neutral-200 bg-white" data-testid="filter-presets">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5 text-neutral-700" />
          <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-700">Saved Views</span>
          <span className="font-mono text-[11px] text-neutral-400">[{presets.length}]</span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              data-testid="save-preset-button"
              className="flex items-center gap-1 text-[10px] tracking-[0.18em] uppercase font-bold text-neutral-700 hover:text-neutral-950"
            >
              <Plus className="w-3 h-3" /> Save current
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-none border border-neutral-200" data-testid="save-preset-dialog">
            <DialogHeader>
              <DialogTitle className="font-display font-medium tracking-tight">Save current filters as preset</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <label className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-500">Preset name</label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="e.g. Delayed Asia ocean"
                className="mt-2 rounded-none border-neutral-200 focus-visible:ring-neutral-950"
                data-testid="preset-name-input"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="rounded-none">Cancel</Button>
              <Button onClick={handleSave} className="rounded-none bg-neutral-950 hover:bg-neutral-800" data-testid="confirm-save-preset">
                Save Preset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {presets.length === 0 ? (
        <div className="px-4 py-3 text-xs text-neutral-400">
          No saved views yet. Configure filters and click <span className="text-neutral-700 font-medium">Save current</span>.
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {presets.map((p) => (
            <li key={p.id} className="px-4 py-2.5 flex items-center justify-between gap-2 group" data-testid={`preset-item-${p.id}`}>
              <button
                onClick={() => { onApply(p.filters); toast.success(`Applied "${p.name}"`); }}
                data-testid={`preset-apply-${p.id}`}
                className="flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-950 min-w-0 flex-1 text-left"
              >
                <Check className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-950" />
                <span className="truncate">{p.name}</span>
              </button>
              <button
                onClick={() => onDelete(p.id)}
                data-testid={`preset-delete-${p.id}`}
                className="text-neutral-300 hover:text-red-600"
                aria-label="Delete preset"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
