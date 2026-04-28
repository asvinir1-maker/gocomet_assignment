import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, Plug, KeyRound, MapPin } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PROVIDER_META = {
  "SAP S/4HANA":         { hint: "OData v2 endpoint, X-CSRF-Token auth" },
  "Oracle NetSuite":     { hint: "SuiteTalk REST endpoint, OAuth 2.0" },
  "MS Dynamics 365":     { hint: "Common Data Service, OAuth 2.0" },
  "Odoo":                { hint: "XML-RPC or JSON-RPC, API key" },
  "Zoho Inventory":      { hint: "REST API, OAuth 2.0 token" },
  "Custom REST API":     { hint: "Any REST endpoint with bearer token" },
};

const STEPS = [
  { k: 1, label: "Provider",  Icon: Plug },
  { k: 2, label: "Connection", Icon: KeyRound },
  { k: 3, label: "Field mapping", Icon: MapPin },
  { k: 4, label: "Test & save", Icon: CheckCircle2 },
];

const DEFAULT_MAPPING = [
  { erp: "PurchaseOrder.Number", target: "doc_number" },
  { erp: "PurchaseOrder.Vendor", target: "party" },
  { erp: "PurchaseOrder.ShipmentRef", target: "shipment_id" },
  { erp: "PurchaseOrder.TotalAmount", target: "value_usd" },
  { erp: "SalesOrder.Number", target: "doc_number" },
  { erp: "SalesOrder.Customer", target: "party" },
];

export default function ErpWizard({ onClose, onCreated, providers = [] }) {
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState(null);
  const [name, setName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [environment, setEnvironment] = useState("production");
  const [mapping] = useState(DEFAULT_MAPPING);
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);
  const [saving, setSaving] = useState(false);

  const canNext = (() => {
    if (step === 1) return !!provider;
    if (step === 2) return name.trim() && endpoint.trim() && apiKey.trim();
    if (step === 3) return true;
    if (step === 4) return tested;
    return false;
  })();

  const test = async () => {
    setTesting(true);
    setTimeout(() => {  // mock latency
      setTested(true); setTesting(false);
      toast.success("Connection test passed");
    }, 900);
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await axios.post(`${API}/integrations`, {
        provider, name, endpoint, environment, api_key: apiKey,
      });
      toast.success(`Connected ${r.data.provider}`);
      onCreated?.(r.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not save integration");
    } finally { setSaving(false); }
  };

  return (
    <div data-testid="erp-wizard" className="border border-neutral-200 bg-white">
      {/* Stepper */}
      <div className="grid grid-cols-4 border-b border-neutral-200">
        {STEPS.map((s) => {
          const active = step === s.k;
          const done = step > s.k;
          const Icon = s.Icon;
          return (
            <div
              key={s.k}
              data-testid={`wizard-step-${s.k}`}
              className={`px-4 py-3 flex items-center gap-3 border-r last:border-r-0 border-neutral-200 ${
                active ? "bg-neutral-950 text-white" : done ? "bg-neutral-50 text-neutral-700" : "text-neutral-400"
              }`}
            >
              <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[11px] font-mono ${
                active ? "border-white bg-white text-neutral-950" :
                done ? "border-emerald-600 bg-emerald-600 text-white" : "border-neutral-300"
              }`}>
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.k}
              </div>
              <div className="leading-tight">
                <div className="text-[9px] tracking-[0.25em] uppercase font-bold opacity-60">Step {s.k}</div>
                <div className="text-sm font-medium">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 md:p-8 min-h-[280px]">
        {step === 1 && (
          <div data-testid="wizard-step1-content">
            <div className="font-display text-2xl font-medium text-neutral-950">Choose your ERP system</div>
            <p className="text-sm text-neutral-600 mt-1">Pick the platform that hosts your purchase &amp; sales orders.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
              {providers.map((p) => {
                const meta = PROVIDER_META[p] || {};
                const sel = provider === p;
                return (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    data-testid={`provider-${p.replace(/\s+/g, "_")}`}
                    className={`text-left p-4 border transition-all ${
                      sel ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white hover:border-neutral-950"
                    }`}
                  >
                    <div className="font-display font-medium">{p}</div>
                    <div className={`text-xs mt-1 ${sel ? "text-white/70" : "text-neutral-500"}`}>{meta.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div data-testid="wizard-step2-content" className="max-w-2xl">
            <div className="font-display text-2xl font-medium text-neutral-950">Connection details</div>
            <p className="text-sm text-neutral-600 mt-1">For <span className="font-medium text-neutral-950">{provider}</span>. Credentials are stored encrypted (mock).</p>
            <div className="mt-6 grid grid-cols-1 gap-4">
              <Field label="Connection name" value={name} onChange={setName} placeholder="e.g. Production SAP" testid="conn-name" />
              <Field label="Endpoint URL" value={endpoint} onChange={setEndpoint} placeholder="https://api.your-erp.com/v2" testid="conn-endpoint" />
              <Field label="API key / token" value={apiKey} onChange={setApiKey} type="password" placeholder="••••••••" testid="conn-apikey" />
              <div>
                <label className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-500">Environment</label>
                <div className="mt-2 flex gap-2">
                  {["production", "sandbox"].map((e) => (
                    <button
                      key={e}
                      onClick={() => setEnvironment(e)}
                      data-testid={`env-${e}`}
                      className={`px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] uppercase border ${
                        environment === e
                          ? "bg-neutral-950 text-white border-neutral-950"
                          : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-950"
                      }`}
                    >{e}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div data-testid="wizard-step3-content">
            <div className="font-display text-2xl font-medium text-neutral-950">Field mapping</div>
            <p className="text-sm text-neutral-600 mt-1">Defaults are applied based on common {provider} schemas. You can adjust later.</p>
            <table className="w-full mt-6 text-sm border border-neutral-200">
              <thead className="bg-[#FAFAFA] border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-2 text-left text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-500">ERP field</th>
                  <th className="px-4 py-2 text-left text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-500">→ UniRoute field</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {mapping.map((m, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 font-mono text-[12px] text-neutral-700">{m.erp}</td>
                    <td className="px-4 py-2 font-mono text-[12px] text-neutral-950">{m.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {step === 4 && (
          <div data-testid="wizard-step4-content" className="max-w-xl">
            <div className="font-display text-2xl font-medium text-neutral-950">Test &amp; save</div>
            <p className="text-sm text-neutral-600 mt-1">Run a quick handshake with {provider} before saving.</p>
            <div className="mt-6 border border-neutral-200 p-5 bg-[#FAFAFA]">
              <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-500">Connection summary</div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-[10px] tracking-[0.2em] uppercase text-neutral-400">Provider</dt><dd className="font-mono text-neutral-950">{provider}</dd></div>
                <div><dt className="text-[10px] tracking-[0.2em] uppercase text-neutral-400">Name</dt><dd className="font-mono text-neutral-950">{name}</dd></div>
                <div className="col-span-2"><dt className="text-[10px] tracking-[0.2em] uppercase text-neutral-400">Endpoint</dt><dd className="font-mono text-[11px] text-neutral-950 break-all">{endpoint}</dd></div>
                <div><dt className="text-[10px] tracking-[0.2em] uppercase text-neutral-400">Environment</dt><dd className="font-mono text-neutral-950">{environment}</dd></div>
              </dl>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={test}
                disabled={testing}
                data-testid="wizard-test-button"
                className="px-4 py-2 text-sm font-medium border border-neutral-950 text-neutral-950 hover:bg-neutral-950 hover:text-white transition-colors flex items-center gap-2"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plug className="w-3.5 h-3.5" />} Run test
              </button>
              {tested && (
                <span className="text-[11px] tracking-[0.18em] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 flex items-center gap-1.5" data-testid="wizard-test-success">
                  <CheckCircle2 className="w-3 h-3" /> Connection ok
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-200 px-6 py-3 flex items-center justify-between">
        <button onClick={onClose} className="text-[11px] tracking-[0.2em] uppercase font-bold text-neutral-500 hover:text-neutral-950">Cancel</button>
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              data-testid="wizard-back"
              className="px-3 py-2 text-[11px] font-bold tracking-[0.18em] uppercase border bg-white text-neutral-700 border-neutral-200 hover:border-neutral-950 flex items-center gap-1"
            >
              <ChevronLeft className="w-3 h-3" /> Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => canNext && setStep(step + 1)}
              disabled={!canNext}
              data-testid="wizard-next"
              className="px-4 py-2 text-[11px] font-bold tracking-[0.18em] uppercase bg-neutral-950 text-white hover:bg-neutral-800 flex items-center gap-1 disabled:opacity-40"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={save}
              disabled={!tested || saving}
              data-testid="wizard-save"
              className="px-4 py-2 text-[11px] font-bold tracking-[0.18em] uppercase bg-neutral-950 text-white hover:bg-neutral-800 flex items-center gap-1 disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save & connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, value, onChange, type = "text", placeholder, testid }) => (
  <div>
    <label className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-500">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      data-testid={testid}
      className="w-full mt-2 px-3 py-2 border border-neutral-200 focus:border-neutral-950 focus:outline-none bg-white font-mono text-sm"
    />
  </div>
);
