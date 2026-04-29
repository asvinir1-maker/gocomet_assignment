import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Loader2, Layers, ChevronDown, MapPin, MessageSquare } from "lucide-react";
import MultimodalTimeline from "../components/MultimodalTimeline";
import StatusBadge from "../components/StatusBadge";
import LinkedOrdersPanel from "../components/LinkedOrdersPanel";
import LinkedDocsPanel from "../components/integrations/LinkedDocsPanel";
import RemarksTab from "../components/RemarksTab";
import { listTemplates, listCustomMilestones } from "../lib/templatesApi";
import { listRemarks } from "../lib/remarksApi";
import { STANDARD_TEMPLATE } from "../lib/milestones";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ShipmentDetail() {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Templates + custom milestones
  const [templates, setTemplates] = useState([STANDARD_TEMPLATE]);
  const [activeTplId, setActiveTplId] = useState(() => {
    return localStorage.getItem(`uniroute-tpl-${id}`) || STANDARD_TEMPLATE.id;
  });
  const [customMilestones, setCustomMilestones] = useState([]);
  const [tplMenuOpen, setTplMenuOpen] = useState(false);

  // Tabs + Remarks
  const [activeTab, setActiveTab] = useState("timeline"); // 'timeline' | 'communications'
  const [remarks, setRemarks] = useState([]);

  const reloadCustoms = useCallback(() => {
    if (!id) return;
    listCustomMilestones(id).then(setCustomMilestones).catch(() => setCustomMilestones([]));
  }, [id]);

  const reloadRemarks = useCallback(() => {
    if (!id) return;
    listRemarks(id).then(setRemarks).catch(() => setRemarks([]));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/shipments/${id}`)
      .then((r) => setShipment(r.data))
      .catch((e) => setError(e.response?.data?.detail || "Not found"))
      .finally(() => setLoading(false));
    axios.get(`${API}/orders-docs/by-shipment/${id}`)
      .then((r) => setDocs(r.data || []))
      .catch(() => setDocs([]));
    listTemplates()
      .then((tpls) => setTemplates([STANDARD_TEMPLATE, ...tpls]))
      .catch(() => setTemplates([STANDARD_TEMPLATE]));
    reloadCustoms();
    reloadRemarks();
  }, [id, reloadCustoms, reloadRemarks]);

  useEffect(() => {
    localStorage.setItem(`uniroute-tpl-${id}`, activeTplId);
  }, [activeTplId, id]);

  const activeTemplate = templates.find((t) => t.id === activeTplId) || STANDARD_TEMPLATE;

  const remarkCounts = useMemo(() => ({
    total: remarks.length,
    public: remarks.filter((r) => r.visibility === "public").length,
  }), [remarks]);

  return (
    <div className="px-6 md:px-12 py-10 bg-white min-h-screen" data-testid="shipment-detail-page">
      <div className="max-w-7xl mx-auto">
        <Link to="/" data-testid="back-link" className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-bold text-neutral-500 hover:text-neutral-950 mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace
        </Link>

        {loading && (
          <div className="flex items-center gap-3 text-neutral-500 py-20 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading shipment…
          </div>
        )}

        {error && !loading && (
          <div className="border border-red-200 bg-red-50 p-8 max-w-xl">
            <div className="font-display text-2xl text-red-700">Shipment not found</div>
            <div className="text-sm text-red-600 mt-1">{error}</div>
          </div>
        )}

        {shipment && !loading && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8 border-b border-neutral-200 pb-6">
              <div>
                <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Shipment</div>
                <h1 className="font-display text-4xl lg:text-5xl tracking-tighter font-medium text-neutral-950 mt-1">
                  {shipment.id}
                </h1>
                <div className="font-mono text-sm text-neutral-500 mt-2">REF: {shipment.reference} · {shipment.consignor} → {shipment.consignee}</div>
              </div>
              <div className="flex items-center gap-3">
                {shipment.delay_days > 0 && (
                  <span data-testid="delay-chip" className="font-mono text-xs tracking-wider uppercase font-bold px-3 py-1.5 bg-red-600 text-white">
                    Delayed +{shipment.delay_days}d
                  </span>
                )}
                <StatusBadge status={shipment.status} />
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-neutral-200 mb-6 flex items-center gap-1">
              <TabButton
                testid="tab-timeline"
                icon={MapPin}
                label="Timeline"
                active={activeTab === "timeline"}
                onClick={() => setActiveTab("timeline")}
              />
              <TabButton
                testid="tab-communications"
                icon={MessageSquare}
                label="Communications"
                active={activeTab === "communications"}
                onClick={() => setActiveTab("communications")}
                badge={remarkCounts.total > 0 ? remarkCounts.total : null}
                publicBadge={remarkCounts.public > 0 ? remarkCounts.public : null}
              />
            </div>

            {activeTab === "timeline" && (
              <>
                {/* Template selector */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-neutral-50 border border-neutral-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4 text-neutral-500" />
                    <div>
                      <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Milestone View</div>
                      <div className="font-mono text-xs text-neutral-700 mt-0.5">
                        {activeTemplate.name}
                        {activeTemplate.description && (
                          <span className="text-neutral-400"> · {activeTemplate.description}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      data-testid="template-selector-btn"
                      onClick={() => setTplMenuOpen(!tplMenuOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-300 text-sm hover:border-neutral-500 transition-colors"
                    >
                      Switch view
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${tplMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                    {tplMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setTplMenuOpen(false)} />
                        <div data-testid="template-selector-menu" className="absolute right-0 top-full mt-1 w-72 bg-white border border-neutral-200 shadow-lg z-40">
                          {templates.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => { setActiveTplId(t.id); setTplMenuOpen(false); }}
                              data-testid={`template-option-${t.id}`}
                              className={`w-full text-left px-3 py-2.5 text-sm border-b border-neutral-100 hover:bg-neutral-50 ${
                                t.id === activeTplId ? "bg-neutral-100" : ""
                              }`}
                            >
                              <div className="font-medium text-neutral-950 flex items-center gap-2">
                                {t.name}
                                {t.is_builtin && (
                                  <span className="font-mono text-[9px] px-1 py-0.5 bg-neutral-200 text-neutral-700">BUILT-IN</span>
                                )}
                              </div>
                              {t.description && (
                                <div className="text-[11px] text-neutral-500 mt-0.5 leading-tight">{t.description}</div>
                              )}
                            </button>
                          ))}
                          <Link to="/templates" className="block px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 font-medium" onClick={() => setTplMenuOpen(false)}>
                            + Manage templates
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <MultimodalTimeline
                  shipment={shipment}
                  template={activeTemplate}
                  customMilestones={customMilestones}
                  remarks={remarks}
                  onCustomChanged={reloadCustoms}
                  onJumpToRemarks={() => setActiveTab("communications")}
                />
                {shipment.linked_orders && <LinkedOrdersPanel orders={shipment.linked_orders} />}
                <LinkedDocsPanel docs={docs} />
              </>
            )}

            {activeTab === "communications" && (
              <RemarksTab
                shipment={shipment}
                remarks={remarks}
                onChanged={reloadRemarks}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({ icon: Icon, label, active, onClick, badge, publicBadge, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 -mb-px transition-colors ${
        active
          ? "border-neutral-950 text-neutral-950 font-medium"
          : "border-transparent text-neutral-500 hover:text-neutral-700"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge ? (
        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-200">
          {badge}
        </span>
      ) : null}
      {publicBadge ? (
        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200" title="Public remarks (visible to customer)">
          {publicBadge} public
        </span>
      ) : null}
    </button>
  );
}
