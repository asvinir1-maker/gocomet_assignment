import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plug, FileSpreadsheet, RefreshCw, Trash2, Loader2, Database, ArrowRight } from "lucide-react";
import ErpWizard from "../components/integrations/ErpWizard";
import FileUploader from "../components/integrations/FileUploader";
import { fmtDateTime } from "../lib/format";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusStyle = {
  connected:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  disconnected: "bg-neutral-100 text-neutral-700 border-neutral-200",
  error:        "bg-red-50 text-red-700 border-red-200",
};

export default function Integrations() {
  const [tab, setTab] = useState("erp"); // erp | upload
  const [providers, setProviders] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [syncingId, setSyncingId] = useState(null);

  const refresh = async () => {
    const [p, i] = await Promise.all([
      axios.get(`${API}/integrations/providers`),
      axios.get(`${API}/integrations`),
    ]);
    setProviders(p.data.providers || []);
    setIntegrations(i.data || []);
  };

  useEffect(() => { refresh().catch(() => toast.error("Failed to load integrations")); }, []);

  const handleSync = async (id) => {
    setSyncingId(id);
    try {
      await axios.post(`${API}/integrations/${id}/sync`);
      toast.success("Sync complete");
      await refresh();
    } catch { toast.error("Sync failed"); }
    finally { setSyncingId(null); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/integrations/${id}`);
      toast.success("Disconnected");
      await refresh();
    } catch { toast.error("Could not disconnect"); }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen" data-testid="integrations-page">
      <header className="px-6 md:px-12 pt-10 pb-6 border-b border-neutral-200 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Data Sources</div>
          <h1 className="font-display text-4xl lg:text-5xl tracking-tighter font-medium text-neutral-950 mt-1">Integrations</h1>
          <p className="text-neutral-600 mt-2 max-w-2xl">
            Pull every Purchase Order and Sales Order into UniRoute and link them to live shipments. Two paths — connect your ERP for live sync, or upload a one-off Excel sheet.
          </p>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-8">
        {/* Tab switcher */}
        <div className="flex items-center gap-2 mb-8 border-b border-neutral-200">
          {[
            { k: "erp", label: "Connect ERP", Icon: Plug },
            { k: "upload", label: "Upload Excel / CSV", Icon: FileSpreadsheet },
          ].map(({ k, label, Icon }) => {
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                data-testid={`tab-${k}`}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 -mb-px transition-colors ${
                  active ? "border-neutral-950 text-neutral-950" : "border-transparent text-neutral-500 hover:text-neutral-950"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium tracking-tight">{label}</span>
              </button>
            );
          })}
        </div>

        {/* ERP tab */}
        {tab === "erp" && (
          <div className="grid grid-cols-1 gap-6">
            {/* Connections list */}
            <section data-testid="connections-list">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Active connections</div>
                  <h2 className="font-display text-2xl tracking-tight font-medium text-neutral-950 mt-1">
                    {integrations.length} system{integrations.length === 1 ? "" : "s"} connected
                  </h2>
                </div>
                {!showWizard && (
                  <button
                    onClick={() => setShowWizard(true)}
                    data-testid="add-integration-button"
                    className="px-4 py-2 text-[11px] font-bold tracking-[0.18em] uppercase bg-neutral-950 text-white hover:bg-neutral-800 flex items-center gap-2"
                  >
                    + Add connection
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.length === 0 && (
                  <div className="border border-dashed border-neutral-300 p-10 text-center text-neutral-500 col-span-full">
                    No integrations yet. Click <span className="font-medium text-neutral-950">Add connection</span> to set up your first ERP.
                  </div>
                )}
                {integrations.map((it) => (
                  <div key={it.id} className="border border-neutral-200 bg-white p-5 flex flex-col gap-3" data-testid={`integration-${it.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">{it.provider}</div>
                        <div className="font-display text-lg text-neutral-950 mt-0.5">{it.name}</div>
                        <div className="font-mono text-[11px] text-neutral-500 mt-1 break-all">{it.endpoint || "—"}</div>
                      </div>
                      <span className={`text-[10px] font-bold tracking-[0.18em] uppercase border px-1.5 py-0.5 ${statusStyle[it.status]}`}>
                        {it.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-[11px] border-t border-neutral-100 pt-3">
                      <div>
                        <div className="text-[10px] tracking-[0.2em] uppercase text-neutral-400">Env</div>
                        <div className="font-mono text-neutral-700">{it.environment || "—"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] tracking-[0.2em] uppercase text-neutral-400">Records</div>
                        <div className="font-mono text-neutral-950">{it.record_count}</div>
                      </div>
                      <div>
                        <div className="text-[10px] tracking-[0.2em] uppercase text-neutral-400">Last sync</div>
                        <div className="font-mono text-neutral-700">{it.last_sync ? fmtDateTime(it.last_sync) : "—"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSync(it.id)}
                        disabled={syncingId === it.id}
                        data-testid={`sync-${it.id}`}
                        className="px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] uppercase border bg-white text-neutral-700 border-neutral-200 hover:border-neutral-950 flex items-center gap-1.5 disabled:opacity-60"
                      >
                        {syncingId === it.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Sync now
                      </button>
                      <button
                        onClick={() => handleDelete(it.id)}
                        data-testid={`delete-${it.id}`}
                        className="px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] uppercase border bg-white text-red-700 border-neutral-200 hover:border-red-600 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3" /> Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Wizard */}
            {showWizard && (
              <section data-testid="wizard-section">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">New connection</div>
                    <h2 className="font-display text-2xl tracking-tight font-medium text-neutral-950 mt-1">Connect a new ERP</h2>
                  </div>
                </div>
                <ErpWizard
                  providers={providers}
                  onClose={() => setShowWizard(false)}
                  onCreated={async () => {
                    setShowWizard(false);
                    await refresh();
                  }}
                />
              </section>
            )}
          </div>
        )}

        {/* Upload tab */}
        {tab === "upload" && (
          <div className="grid grid-cols-1 gap-6">
            <FileUploader />
            <div className="border border-neutral-200 bg-white p-5 flex items-center justify-between" data-testid="orders-link">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-neutral-700" />
                <div>
                  <div className="font-display font-medium text-neutral-950">Imported docs live here</div>
                  <div className="text-sm text-neutral-500">All POs and SOs end up on the Orders &amp; POs page, linked to their shipments.</div>
                </div>
              </div>
              <a href="/orders-pos" className="text-[11px] font-bold tracking-[0.18em] uppercase border bg-white text-neutral-700 border-neutral-200 hover:border-neutral-950 px-3 py-2 flex items-center gap-1.5">
                Open Orders &amp; POs <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
