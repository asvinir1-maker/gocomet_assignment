import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Layers, Plus, Copy, Trash2, Edit3, Check, X, Loader2,
  Plane, Ship, Truck, ArrowLeft, Sparkles,
} from "lucide-react";
import {
  listTemplates, createTemplate, updateTemplate, cloneTemplate, deleteTemplate,
} from "../lib/templatesApi";
import { STANDARD_TEMPLATE } from "../lib/milestones";
import { toast } from "sonner";

const MODES = [
  { key: "air", label: "Air", icon: Plane },
  { key: "ocean", label: "Ocean", icon: Ship },
  { key: "road", label: "Road", icon: Truck },
];

function emptyTemplateMilestones() {
  return { air: [], ocean: [], road: [] };
}

export default function Templates() {
  const [templates, setTemplates] = useState([STANDARD_TEMPLATE]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // template being edited
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    listTemplates()
      .then((tpls) => setTemplates([STANDARD_TEMPLATE, ...tpls]))
      .catch(() => setTemplates([STANDARD_TEMPLATE]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleClone = async (id) => {
    if (id === STANDARD_TEMPLATE.id) {
      // Clone standard locally → create new on backend
      try {
        const newTpl = await createTemplate({
          name: "Standard (Copy)",
          description: "Cloned from built-in standard milestones",
          milestones: STANDARD_TEMPLATE.milestones,
        });
        toast.success("Cloned standard");
        refresh();
        setEditing(newTpl);
      } catch {
        toast.error("Failed to clone");
      }
      return;
    }
    try {
      const cloned = await cloneTemplate(id);
      toast.success(`Cloned: ${cloned.name}`);
      refresh();
    } catch {
      toast.error("Failed to clone");
    }
  };

  const handleDelete = async (t) => {
    if (t.is_builtin) {
      toast.error("Built-in templates cannot be deleted. Clone first.");
      return;
    }
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    try {
      await deleteTemplate(t.id);
      toast.success("Template deleted");
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to delete");
    }
  };

  return (
    <div className="px-6 md:px-12 py-10 bg-white min-h-screen" data-testid="templates-page">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-bold text-neutral-500 hover:text-neutral-950 mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 border-b border-neutral-200 pb-6">
          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400 flex items-center gap-2">
              <Layers className="w-3 h-3" /> Configuration
            </div>
            <h1 className="font-display text-4xl lg:text-5xl tracking-tighter font-medium text-neutral-950 mt-1">
              Milestone Templates
            </h1>
            <p className="text-sm text-neutral-500 mt-2 max-w-2xl">
              Define custom milestone views per transport mode. Each template can be applied to any shipment to override the default mode-based milestone set.
            </p>
          </div>
          <button
            data-testid="create-template-btn"
            onClick={() => setCreating(true)}
            className="px-4 py-2.5 bg-neutral-950 text-white text-sm font-medium hover:bg-neutral-800 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Template
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-neutral-500 py-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => setEditing(t)}
                onClone={() => handleClone(t.id)}
                onDelete={() => handleDelete(t)}
              />
            ))}
          </div>
        )}
      </div>

      {(editing || creating) && (
        <TemplateEditor
          template={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { refresh(); setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}

function TemplateCard({ template, onEdit, onClone, onDelete }) {
  const counts = MODES.map(({ key }) => (template.milestones?.[key] || []).length);
  return (
    <div
      data-testid={`template-card-${template.id}`}
      className="border border-neutral-200 bg-white p-5 hover:border-neutral-400 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg font-medium text-neutral-950 flex items-center gap-2 flex-wrap">
            {template.name}
            {template.is_builtin && (
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-neutral-200 text-neutral-700 tracking-wider">BUILT-IN</span>
            )}
          </div>
          {template.description && (
            <p className="text-xs text-neutral-500 mt-1">{template.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {MODES.map(({ key, label, icon: Icon }, i) => (
          <div key={key} className="border border-neutral-200 px-2 py-2 bg-neutral-50">
            <div className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase font-bold text-neutral-500">
              <Icon className="w-3 h-3" /> {label}
            </div>
            <div className="font-mono text-base text-neutral-950 mt-0.5">{counts[i]}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center gap-2">
        {!template.is_builtin && (
          <button
            data-testid={`edit-tpl-${template.id}`}
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-neutral-300 hover:border-neutral-700"
          >
            <Edit3 className="w-3 h-3" /> Edit
          </button>
        )}
        <button
          data-testid={`clone-tpl-${template.id}`}
          onClick={onClone}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-neutral-300 hover:border-neutral-700"
        >
          <Copy className="w-3 h-3" /> Clone
        </button>
        {!template.is_builtin && (
          <button
            data-testid={`delete-tpl-${template.id}`}
            onClick={onDelete}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function TemplateEditor({ template, onClose, onSaved }) {
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [milestones, setMilestones] = useState(
    template?.milestones || emptyTemplateMilestones(),
  );
  const [activeMode, setActiveMode] = useState("air");
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState(null); // active mode key when picker is open

  const updateModeList = (mode, newList) => {
    setMilestones((prev) => ({ ...prev, [mode]: newList }));
  };

  const addStandardItems = (mode, items) => {
    const existingCodes = new Set((milestones[mode] || []).map((m) => (m.code || "").toUpperCase()));
    const additions = items
      .filter((m) => !existingCodes.has((m.code || "").toUpperCase()))
      .map((m) => ({ code: m.code, label: m.label, offset_pct: m.offset_pct }));
    if (additions.length === 0) {
      toast.info("All selected milestones already added");
      return;
    }
    const merged = [...(milestones[mode] || []), ...additions].sort(
      (a, b) => a.offset_pct - b.offset_pct,
    );
    updateModeList(mode, merged);
    setPicker(null);
  };

  const addCustomItem = (mode) => {
    updateModeList(mode, [
      ...(milestones[mode] || []),
      { code: "NEW", label: "New milestone", offset_pct: 50 },
    ]);
    setPicker(null);
  };

  const updateItem = (mode, idx, patch) => {
    const next = [...(milestones[mode] || [])];
    next[idx] = { ...next[idx], ...patch };
    updateModeList(mode, next);
  };

  const removeItem = (mode, idx) => {
    const next = (milestones[mode] || []).filter((_, i) => i !== idx);
    updateModeList(mode, next);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      if (template && !template.is_builtin) {
        await updateTemplate(template.id, {
          name: name.trim(),
          description: description.trim() || null,
          milestones,
        });
        toast.success("Template updated");
      } else {
        await createTemplate({
          name: name.trim(),
          description: description.trim() || null,
          milestones,
        });
        toast.success("Template created");
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      data-testid="template-editor"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-neutral-200 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">
              {template ? "Edit Template" : "New Template"}
            </div>
            <h3 className="font-display text-2xl font-medium text-neutral-950 mt-0.5">
              {template ? template.name : "Create Custom Milestone View"}
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="col-span-1">
              <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Name</label>
              <input
                data-testid="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm px-2 py-1.5 border border-neutral-300 focus:border-neutral-950 outline-none"
                placeholder="Pharma Cold-Chain"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Description</label>
              <input
                data-testid="tpl-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm px-2 py-1.5 border border-neutral-300 focus:border-neutral-950 outline-none"
                placeholder="What this view is used for"
              />
            </div>
          </div>

          <div className="border-b border-neutral-200 flex items-center gap-1 mb-4">
            {MODES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                data-testid={`mode-tab-${key}`}
                onClick={() => setActiveMode(key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
                  activeMode === key
                    ? "border-neutral-950 text-neutral-950 font-medium"
                    : "border-transparent text-neutral-500 hover:text-neutral-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                <span className="font-mono text-[10px] text-neutral-400">
                  ({(milestones[key] || []).length})
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {(milestones[activeMode] || []).map((m, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-center p-2 border border-neutral-200 bg-white"
              >
                <div className="col-span-2">
                  <input
                    data-testid={`m-code-${activeMode}-${idx}`}
                    value={m.code}
                    onChange={(e) => updateItem(activeMode, idx, { code: e.target.value.toUpperCase().slice(0, 6) })}
                    className="w-full font-mono text-xs px-2 py-1 border border-neutral-300 focus:border-neutral-950 outline-none"
                    maxLength={6}
                    placeholder="CODE"
                  />
                </div>
                <div className="col-span-5">
                  <input
                    data-testid={`m-label-${activeMode}-${idx}`}
                    value={m.label}
                    onChange={(e) => updateItem(activeMode, idx, { label: e.target.value })}
                    className="w-full text-sm px-2 py-1 border border-neutral-300 focus:border-neutral-950 outline-none"
                    placeholder="Label"
                  />
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <input
                    data-testid={`m-offset-${activeMode}-${idx}`}
                    type="range"
                    min={-50}
                    max={150}
                    value={m.offset_pct}
                    onChange={(e) => updateItem(activeMode, idx, { offset_pct: Number(e.target.value) })}
                    className="flex-1 accent-neutral-950"
                  />
                  <span className="font-mono text-[10px] text-neutral-600 w-12 text-right">
                    {m.offset_pct}%
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => removeItem(activeMode, idx)}
                    className="p-1 text-red-600 hover:bg-red-50"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {picker === activeMode ? (
              <MilestonePicker
                mode={activeMode}
                existing={milestones[activeMode] || []}
                onAddStandard={(items) => addStandardItems(activeMode, items)}
                onAddCustom={() => addCustomItem(activeMode)}
                onClose={() => setPicker(null)}
              />
            ) : (
              <button
                data-testid={`add-milestone-${activeMode}`}
                onClick={() => setPicker(activeMode)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-mono uppercase tracking-wider text-neutral-500 hover:text-neutral-950 hover:bg-neutral-50 border border-dashed border-neutral-300 hover:border-neutral-500 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add milestone for {activeMode}
              </button>
            )}
          </div>

          <div className="mt-3 text-[11px] text-neutral-500 font-mono">
            Position: <span className="text-neutral-700">-50%</span> = before leg starts ·{" "}
            <span className="text-neutral-700">0%</span> = at leg departure ·{" "}
            <span className="text-neutral-700">100%</span> = at leg arrival ·{" "}
            <span className="text-neutral-700">150%</span> = after leg ends
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-950 flex items-center gap-1.5">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            data-testid="save-template-btn"
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-neutral-950 text-white hover:bg-neutral-800 disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}


function MilestonePicker({ mode, existing, onAddStandard, onAddCustom, onClose }) {
  const standardList = STANDARD_TEMPLATE.milestones[mode] || [];
  const existingCodes = new Set((existing || []).map((m) => (m.code || "").toUpperCase()));
  const [selected, setSelected] = useState(new Set());

  const toggle = (code) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code); else next.add(code);
    setSelected(next);
  };

  const handleAddSelected = () => {
    const items = standardList.filter((m) => selected.has(m.code));
    if (items.length === 0) return;
    onAddStandard(items);
  };

  const available = standardList.filter((m) => !existingCodes.has((m.code || "").toUpperCase()));

  return (
    <div
      data-testid={`milestone-picker-${mode}`}
      className="border border-neutral-300 bg-neutral-50 p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-600 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Add milestone for {mode}
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-700"
          aria-label="Close picker"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="text-[11px] text-neutral-500 mb-2">
        Pick from the standard {mode} milestone library, or create a brand-new stage.
      </div>

      {available.length === 0 ? (
        <div className="text-xs text-neutral-500 italic px-2 py-3 bg-white border border-dashed border-neutral-300 mb-2">
          All standard {mode} milestones are already added. You can still create a custom one below.
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto border border-neutral-200 bg-white divide-y divide-neutral-100 mb-2">
          {available.map((m) => {
            const checked = selected.has(m.code);
            return (
              <label
                key={m.code}
                data-testid={`picker-item-${mode}-${m.code}`}
                className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer text-sm hover:bg-neutral-50 ${
                  checked ? "bg-amber-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(m.code)}
                  className="w-3.5 h-3.5 accent-neutral-950"
                />
                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-700 tracking-wider">
                  {m.code}
                </span>
                <span className="flex-1 truncate text-neutral-800">{m.label}</span>
                <span className="font-mono text-[10px] text-neutral-400">{m.offset_pct}%</span>
              </label>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          data-testid={`picker-add-selected-${mode}`}
          onClick={handleAddSelected}
          disabled={selected.size === 0}
          className="px-3 py-1.5 text-xs font-medium bg-neutral-950 text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Plus className="w-3 h-3" /> Add selected {selected.size > 0 && `(${selected.size})`}
        </button>
        <button
          data-testid={`picker-add-custom-${mode}`}
          onClick={onAddCustom}
          className="px-3 py-1.5 text-xs font-medium border border-neutral-300 hover:border-neutral-700 flex items-center gap-1.5 ml-auto"
        >
          <Plus className="w-3 h-3" /> Create new milestone stage
        </button>
      </div>
    </div>
  );
}
