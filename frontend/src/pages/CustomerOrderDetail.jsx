import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Loader2 } from "lucide-react";
import CustomerTimeline from "../components/CustomerTimeline";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CustomerOrderDetail() {
  const { orderNo } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/orders/${orderNo}`)
      .then(r => setOrder(r.data))
      .catch(e => setError(e.response?.data?.detail || "Order not found"))
      .finally(() => setLoading(false));
  }, [orderNo]);

  return (
    <div className="px-6 md:px-12 py-10 bg-white min-h-screen" data-testid="customer-order-page">
      <div className="max-w-5xl mx-auto">
        <Link to="/" data-testid="back-link" className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-bold text-neutral-500 hover:text-neutral-950 mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>

        {loading && (
          <div className="flex items-center gap-3 text-neutral-500 py-20 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Looking up your order…
          </div>
        )}

        {error && !loading && (
          <div className="border border-red-200 bg-red-50 p-8 max-w-xl">
            <div className="font-display text-2xl text-red-700">Order not found</div>
            <div className="text-sm text-red-600 mt-1">{error}</div>
          </div>
        )}

        {order && !loading && (
          <>
            <div className="mb-8">
              <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Order Tracking</div>
              <h1 className="font-display text-4xl lg:text-5xl tracking-tighter font-medium text-neutral-950 mt-1">
                Hi {order.customer_name?.split(" ")[0]} 👋
              </h1>
              <p className="text-neutral-600 mt-2">Here's where your <span className="text-neutral-950 font-medium">{order.product}</span> is right now.</p>
            </div>
            <CustomerTimeline shipment={order} />
          </>
        )}
      </div>
    </div>
  );
}
