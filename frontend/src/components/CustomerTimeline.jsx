import React, { useState } from "react";
import {
  Truck, Ship, Plane, Package, Home, Globe2, Warehouse, CheckCircle2, Clock,
  AlertTriangle, Headphones, Phone, Mail, MessageCircle, X,
} from "lucide-react";

/**
 * CustomerTimeline — friendly, simplified view for end-customers.
 * Maps technical legs into human-readable milestones.
 */

// Map a leg to a friendly milestone label & icon
const milestoneFor = (leg, idx, total) => {
  const isFirstRoad = idx === 0 && leg.mode === "road";
  const isLastRoad = idx === total - 1 && leg.mode === "road";
  if (isFirstRoad) return { title: "Shipped from Factory", Icon: Warehouse };
  if (leg.mode === "ocean") return { title: "International Sea Transit", Icon: Ship };
  if (leg.mode === "air") return { title: "Domestic Flight to Your City", Icon: Plane };
  if (isLastRoad) return { title: "Out for Delivery", Icon: Truck };
  // Middle road leg (after ocean) — distinguish customs/short-haul vs long-haul to your city
  if (leg.mode === "road" && idx >= 2) {
    const code = (leg.to_code || "").toUpperCase();
    if (code.includes("HUB") || code.endsWith("-DC") || code.includes("WH")) {
      return { title: "Domestic Road Transit", Icon: Truck };
    }
    return { title: "Arrived in India · Customs", Icon: Globe2 };
  }
  return { title: "In Transit", Icon: Truck };
};

const dotClass = (status) => {
  if (status === "completed") return "bg-emerald-600 border-emerald-600";
  if (status === "in_transit" || status === "active") return "bg-amber-500 border-amber-500 leg-pulse";
  if (status === "delayed") return "bg-red-600 border-red-600";
  return "bg-white border-neutral-300";
};

export default function CustomerTimeline({ shipment }) {
  const [delayOpen, setDelayOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  if (!shipment) return null;

  const legs = shipment.legs || [];
  const completed = legs.filter(l => l.status === "completed").length;
  const isDelayed = shipment.status === "delayed" || (shipment.delay_days || 0) > 0;

  return (
    <div data-testid="customer-timeline" className="w-full fade-up">
      {/* Order summary card */}
      <div className="border border-neutral-200 bg-white p-6 md:p-8 mb-8 grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200">
        <div className="bg-white p-5 md:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-neutral-950 text-white flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Your Order</div>
              <div className="font-mono text-sm text-neutral-950">{shipment.order_number}</div>
            </div>
          </div>
          <div className="font-display text-lg text-neutral-950 leading-tight">{shipment.product}</div>
          <div className="text-xs text-neutral-500 mt-2">From {shipment.consignor}</div>
        </div>

        <div className="bg-white p-5">
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Delivering To</div>
          <div className="font-display text-xl text-neutral-950 mt-1 flex items-center gap-2">
            <Home className="w-4 h-4 text-neutral-400" /> {shipment.customer_name}
          </div>
          <div className="text-sm text-neutral-600 mt-0.5">{shipment.customer_city}, India</div>
        </div>

        <div className="bg-white p-5">
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Expected Delivery</div>
          <div className="font-display text-xl text-neutral-950 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" /> {shipment.eta}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            {completed} of {legs.length} milestones complete
          </div>
        </div>
      </div>

      {/* Vertical stepper */}
      <div className="border border-neutral-200 bg-white p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">Order Journey</div>
          <div className="flex items-center gap-2">
            <button
              data-testid="cta-view-delay-reason"
              onClick={() => setDelayOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors ${
                isDelayed
                  ? "border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-700"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              View Delay Reason
            </button>
            <button
              data-testid="cta-contact-support"
              onClick={() => setSupportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-950 text-white hover:bg-neutral-800"
            >
              <Headphones className="w-3.5 h-3.5" />
              Contact Support
            </button>
          </div>
        </div>

        <ol className="relative">
          {legs.map((leg, idx) => {
            const m = milestoneFor(leg, idx, legs.length);
            const Icon = m.Icon;
            const last = idx === legs.length - 1;
            const isDone = leg.status === "completed";
            const isActive = leg.status === "in_transit" || leg.status === "active";
            return (
              <li key={leg.leg_id} data-testid="customer-step" className="relative pl-12 pb-8 last:pb-0">
                {!last && (
                  <span className={`absolute left-[15px] top-8 bottom-0 w-px ${
                    isDone ? "bg-emerald-600" : "bg-neutral-200"
                  }`} />
                )}
                <span className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${dotClass(leg.status)}`}>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
                  ) : (
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-neutral-500"}`} />
                  )}
                </span>

                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                  <h3 className={`font-display font-medium text-lg ${isDone ? "text-neutral-950" : isActive ? "text-neutral-950" : "text-neutral-500"}`}>
                    {m.title}
                  </h3>
                  {isActive && (
                    <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5">
                      In Progress
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                      Completed
                    </span>
                  )}
                </div>

                <div className="text-sm text-neutral-700">
                  {leg.from_location} <span className="text-neutral-400">→</span> {leg.to_location}
                </div>
                <div className="font-mono text-[11px] text-neutral-500 mt-1">
                  {new Date(leg.departure).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  {" — "}
                  {new Date(leg.arrival).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
                {leg.notes && (
                  <div className="text-xs text-neutral-500 italic mt-1.5">{leg.notes}</div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Help footer — replaced by CustomerActions on the page */}

      {delayOpen && <DelayReasonDialog shipment={shipment} onClose={() => setDelayOpen(false)} />}
      {supportOpen && <ContactSupportDialog shipment={shipment} onClose={() => setSupportOpen(false)} />}
    </div>
  );
}

function DelayReasonDialog({ shipment, onClose }) {
  const isDelayed = shipment.status === "delayed" || (shipment.delay_days || 0) > 0;
  const legs = shipment.legs || [];
  const delayedLeg = legs.find((l) => l.status === "delayed") || null;

  return (
    <div
      data-testid="delay-reason-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-neutral-200 w-full max-w-md shadow-2xl">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${isDelayed ? "text-red-600" : "text-neutral-400"}`} />
            <h3 className="font-display text-lg font-medium text-neutral-950">Delay Information</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          {isDelayed ? (
            <>
              <div className="text-sm text-neutral-700">
                Your shipment is currently running{" "}
                <span className="font-bold text-red-700">
                  {shipment.delay_days || 1} day{(shipment.delay_days || 1) > 1 ? "s" : ""} behind schedule
                </span>
                .
              </div>

              <div className="mt-4 border border-red-200 bg-red-50 p-3">
                <div className="text-[10px] tracking-[0.2em] uppercase font-bold text-red-700">
                  Reason
                </div>
                <div className="text-sm text-red-900 mt-1">
                  {delayedLeg?.notes ||
                    shipment.delay_reason ||
                    "Adverse weather and port congestion at the transshipment hub have caused a temporary holdup. Our operations team is actively coordinating with the carrier to recover the delay."}
                </div>
              </div>

              {delayedLeg && (
                <div className="mt-3 text-xs text-neutral-500">
                  Affected leg:{" "}
                  <span className="text-neutral-800 font-medium">
                    {delayedLeg.from_location} → {delayedLeg.to_location}
                  </span>
                </div>
              )}

              <div className="mt-4 text-xs text-neutral-500">
                Updated ETA: <span className="font-mono text-neutral-800">{shipment.eta}</span>
              </div>
            </>
          ) : (
            <div className="text-sm text-neutral-700">
              Good news — your shipment is currently on schedule. No delays reported.
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm bg-neutral-950 text-white hover:bg-neutral-800"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactSupportDialog({ shipment, onClose }) {
  const channels = [
    {
      key: "call",
      Icon: Phone,
      label: "Call us",
      detail: "+91 1800-200-7777 · 24×7 IST",
      href: "tel:+9118002007777",
    },
    {
      key: "email",
      Icon: Mail,
      label: "Email support",
      detail: `support@uniroute.com · Ref ${shipment.order_number || shipment.id}`,
      href: `mailto:support@uniroute.com?subject=Help with order ${shipment.order_number || shipment.id}`,
    },
    {
      key: "chat",
      Icon: MessageCircle,
      label: "Live chat",
      detail: "Typical reply under 2 minutes",
      href: null,
    },
  ];

  return (
    <div
      data-testid="contact-support-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-neutral-200 w-full max-w-md shadow-2xl">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-neutral-700" />
            <h3 className="font-display text-lg font-medium text-neutral-950">Contact Support</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          <div className="text-sm text-neutral-600 mb-4">
            Pick the channel that works best for you. Have your order number{" "}
            <span className="font-mono text-neutral-900">{shipment.order_number || shipment.id}</span> ready.
          </div>
          <div className="space-y-2">
            {channels.map(({ key, Icon, label, detail, href }) => {
              const Tag = href ? "a" : "button";
              return (
                <Tag
                  key={key}
                  href={href || undefined}
                  data-testid={`support-channel-${key}`}
                  onClick={!href ? () => { window.alert("Live chat will open here. (Demo)"); } : undefined}
                  className="w-full flex items-center gap-3 p-3 border border-neutral-200 hover:border-neutral-700 text-left"
                >
                  <div className="w-9 h-9 bg-neutral-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-neutral-700" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-neutral-950">{label}</div>
                    <div className="text-xs text-neutral-500">{detail}</div>
                  </div>
                </Tag>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
