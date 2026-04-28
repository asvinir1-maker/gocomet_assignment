import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Loader2 } from "lucide-react";
import MultimodalTimeline from "../components/MultimodalTimeline";
import StatusBadge from "../components/StatusBadge";
import LinkedOrdersPanel from "../components/LinkedOrdersPanel";
import LinkedDocsPanel from "../components/integrations/LinkedDocsPanel";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ShipmentDetail() {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/shipments/${id}`)
      .then((r) => setShipment(r.data))
      .catch((e) => setError(e.response?.data?.detail || "Not found"))
      .finally(() => setLoading(false));
    axios.get(`${API}/orders-docs/by-shipment/${id}`)
      .then((r) => setDocs(r.data || []))
      .catch(() => setDocs([]));
  }, [id]);

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
                  <span
                    data-testid="delay-chip"
                    className="font-mono text-xs tracking-wider uppercase font-bold px-3 py-1.5 bg-red-600 text-white"
                  >
                    Delayed +{shipment.delay_days}d
                  </span>
                )}
                <StatusBadge status={shipment.status} />
              </div>
            </div>
            <MultimodalTimeline shipment={shipment} />
            {shipment.linked_orders && <LinkedOrdersPanel orders={shipment.linked_orders} />}
            <LinkedDocsPanel docs={docs} />
          </>
        )}
      </div>
    </div>
  );
}
