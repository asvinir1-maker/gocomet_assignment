import React, { useState } from "react";
import {
  MessageSquare, Bell, AlertCircle, Phone, Mail, MessageCircle,
  Download, Share2, CalendarClock, Star, X, Loader2, Check,
  Smartphone, Headphones,
} from "lucide-react";
import { toast } from "sonner";

/**
 * CustomerActions — call-to-action panel for the customer order page.
 * Contains 3 hero CTAs with modal flows + a row of quick actions.
 *
 * NOTE: All actions are MOCKED — they show toast confirmations but do not
 * actually open chat, send SMS, or file tickets. Wire to real services later.
 */

export default function CustomerActions({ shipment }) {
  const [supportOpen, setSupportOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);

  const isDelivered = shipment.status === "delivered" || shipment.status === "completed";

  const copyTrackingLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Tracking link copied", { description: url });
    } catch {
      toast.error("Couldn't copy. Long-press the URL bar to copy.");
    }
  };

  const downloadInvoice = () => {
    toast.success("Invoice ready", {
      description: `Receipt for order ${shipment.order_number} will download shortly.`,
    });
  };

  const reschedule = () => {
    setSupportOpen(true);
    toast.info("Let our team know your preferred delivery slot");
  };

  const rateService = () => {
    toast.success("Thanks for rating! ⭐⭐⭐⭐⭐", {
      description: "Your feedback helps us improve.",
    });
  };

  return (
    <div data-testid="customer-actions" className="mt-8">
      <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400 mb-4">
        Need Help With Your Order?
      </div>

      {/* Hero CTAs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <CTACard
          testid="cta-support"
          icon={MessageSquare}
          title="Contact Support"
          subtitle="Chat, call, or email — avg. 2 min response"
          accent="bg-neutral-950 text-white"
          onClick={() => setSupportOpen(true)}
        />
        <CTACard
          testid="cta-notify"
          icon={Bell}
          title="Get Updates"
          subtitle="Real-time SMS, WhatsApp, or email alerts"
          accent="bg-emerald-600 text-white"
          onClick={() => setNotifyOpen(true)}
        />
        <CTACard
          testid="cta-issue"
          icon={AlertCircle}
          title="Report an Issue"
          subtitle="Damaged, delayed, or missing? Tell us"
          accent="bg-amber-600 text-white"
          onClick={() => setIssueOpen(true)}
        />
      </div>

      {/* Quick actions row */}
      <div className="border border-neutral-200 bg-neutral-50 px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400 mr-1">
          Quick actions
        </span>
        <QuickAction icon={Download} label="Invoice" onClick={downloadInvoice} testid="qa-invoice" />
        <QuickAction icon={Share2} label="Share tracking" onClick={copyTrackingLink} testid="qa-share" />
        {!isDelivered && (
          <QuickAction icon={CalendarClock} label="Reschedule" onClick={reschedule} testid="qa-reschedule" />
        )}
        {isDelivered && (
          <QuickAction icon={Star} label="Rate service" onClick={rateService} testid="qa-rate" />
        )}
      </div>

      {/* Trust footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        <div className="text-neutral-500">
          24×7 support · <a href="tel:+911800123456" className="font-mono text-neutral-700 hover:text-neutral-950">+91-1800-123-456</a>
          {" "}· <a href={`mailto:support@technova.com?subject=Order ${shipment.order_number}`} className="font-mono text-neutral-700 hover:text-neutral-950">support@technova.com</a>
        </div>
        <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">
          Powered by UniRoute
        </div>
      </div>

      {/* Modals */}
      {supportOpen && <SupportModal shipment={shipment} onClose={() => setSupportOpen(false)} />}
      {notifyOpen && <NotifyModal shipment={shipment} onClose={() => setNotifyOpen(false)} />}
      {issueOpen && <IssueModal shipment={shipment} onClose={() => setIssueOpen(false)} />}
    </div>
  );
}

// =============================================================
// Reusable building blocks
// =============================================================
function CTACard({ icon: Icon, title, subtitle, accent, onClick, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className="text-left border border-neutral-200 bg-white hover:border-neutral-500 transition-colors group p-5 flex items-start gap-4"
    >
      <div className={`w-10 h-10 ${accent} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display text-base font-medium text-neutral-950 group-hover:text-neutral-950">
          {title}
        </div>
        <div className="text-xs text-neutral-500 mt-1 leading-snug">{subtitle}</div>
      </div>
    </button>
  );
}

function QuickAction({ icon: Icon, label, onClick, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-neutral-200 hover:border-neutral-500 transition-colors"
    >
      <Icon className="w-3.5 h-3.5 text-neutral-600" /> {label}
    </button>
  );
}

function ModalShell({ title, subtitle, onClose, testid, children, footer }) {
  return (
    <div
      data-testid={testid}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-neutral-200 w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-start justify-between">
          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-neutral-400">
              Customer Support
            </div>
            <h3 className="font-display text-xl font-medium text-neutral-950 mt-0.5">{title}</h3>
            {subtitle && <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-neutral-200">{footer}</div>}
      </div>
    </div>
  );
}

// =============================================================
// Support Modal
// =============================================================
function SupportModal({ shipment, onClose }) {
  const [submitting, setSubmitting] = useState(false);

  const open = (channel) => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onClose();
      if (channel === "chat") {
        toast.success("Live chat opened", { description: "An agent will join in a moment." });
      } else if (channel === "call") {
        toast.success("We'll call you in 2 minutes", { description: `On the number linked to order ${shipment.order_number}` });
      } else if (channel === "email") {
        window.location.href = `mailto:support@technova.com?subject=Order ${shipment.order_number}&body=Hi, I have a question about my order ${shipment.order_number}.`;
      } else if (channel === "whatsapp") {
        window.open(`https://wa.me/911800123456?text=Hi, I have a question about order ${shipment.order_number}`, "_blank");
      }
    }, 600);
  };

  return (
    <ModalShell
      testid="support-modal"
      title="How can we help?"
      subtitle={`Reference: ${shipment.order_number}`}
      onClose={onClose}
    >
      <div className="space-y-2">
        <ChannelOption
          testid="ch-chat"
          icon={MessageCircle}
          title="Live chat"
          subtitle="Avg. 2 min wait · 24×7"
          badge={<span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200">FASTEST</span>}
          onClick={() => open("chat")}
          loading={submitting}
        />
        <ChannelOption
          testid="ch-call"
          icon={Phone}
          title="Request a callback"
          subtitle="We'll call within 2 minutes"
          onClick={() => open("call")}
          loading={submitting}
        />
        <ChannelOption
          testid="ch-whatsapp"
          icon={Smartphone}
          title="WhatsApp"
          subtitle="Chat on WhatsApp · Replies in &lt;5 min"
          onClick={() => open("whatsapp")}
          loading={submitting}
        />
        <ChannelOption
          testid="ch-email"
          icon={Mail}
          title="Email"
          subtitle="support@technova.com · ~4 hr response"
          onClick={() => open("email")}
          loading={submitting}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-200 flex items-center gap-2 text-xs text-neutral-500">
        <Headphones className="w-3.5 h-3.5" />
        <span>All channels available 24×7. Order details auto-shared.</span>
      </div>
    </ModalShell>
  );
}

function ChannelOption({ icon: Icon, title, subtitle, badge, onClick, loading, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-3 p-3 border border-neutral-200 hover:border-neutral-500 hover:bg-neutral-50 transition-colors text-left disabled:opacity-50"
    >
      <div className="w-9 h-9 bg-neutral-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-neutral-700" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-neutral-950 flex items-center gap-2">
          {title} {badge}
        </div>
        <div className="text-xs text-neutral-500" dangerouslySetInnerHTML={{ __html: subtitle }} />
      </div>
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400" /> : null}
    </button>
  );
}

// =============================================================
// Notify Modal — opt-in for SMS/WhatsApp/Email updates
// =============================================================
function NotifyModal({ shipment, onClose }) {
  const [phone, setPhone] = useState("+91 ");
  const [email, setEmail] = useState("");
  const [channels, setChannels] = useState({ sms: true, whatsapp: true, email: false });
  const [saving, setSaving] = useState(false);

  const toggle = (k) => setChannels((c) => ({ ...c, [k]: !c[k] }));

  const submit = (e) => {
    e.preventDefault();
    if (channels.sms && phone.trim().length < 7) return toast.error("Enter a valid phone number");
    if (channels.email && !/.+@.+\..+/.test(email)) return toast.error("Enter a valid email");
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onClose();
      const enabled = Object.entries(channels).filter(([, v]) => v).map(([k]) => k.toUpperCase()).join(", ");
      toast.success("Notifications enabled", {
        description: `${enabled} alerts on for order ${shipment.order_number}`,
      });
    }, 700);
  };

  return (
    <ModalShell
      testid="notify-modal"
      title="Get real-time updates"
      subtitle={`Stay in the loop for ${shipment.order_number}`}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-950">
            Cancel
          </button>
          <button
            data-testid="notify-submit"
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            Subscribe
          </button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-2">
            Where should we send updates?
          </label>
          <div className="space-y-2">
            <ChannelToggle label="SMS" desc="Text message" enabled={channels.sms} onToggle={() => toggle("sms")} />
            <ChannelToggle label="WhatsApp" desc="Free messages" enabled={channels.whatsapp} onToggle={() => toggle("whatsapp")} />
            <ChannelToggle label="Email" desc="Inbox digest" enabled={channels.email} onToggle={() => toggle("email")} />
          </div>
        </div>

        {(channels.sms || channels.whatsapp) && (
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Phone</label>
            <input
              data-testid="notify-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-sm px-2 py-2 border border-neutral-300 focus:border-emerald-600 outline-none font-mono"
              placeholder="+91 98765 43210"
            />
          </div>
        )}

        {channels.email && (
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">Email</label>
            <input
              data-testid="notify-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm px-2 py-2 border border-neutral-300 focus:border-emerald-600 outline-none"
              placeholder="you@example.com"
            />
          </div>
        )}

        <div className="text-[11px] text-neutral-500 leading-snug">
          You'll get alerts for milestone changes, delays, and delivery slots. Standard message rates may apply.
        </div>
      </form>
    </ModalShell>
  );
}

function ChannelToggle({ label, desc, enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-2.5 border ${
        enabled ? "border-emerald-600 bg-emerald-50" : "border-neutral-200 bg-white"
      } transition-colors`}
    >
      <div className="text-left">
        <div className="text-sm font-medium text-neutral-950">{label}</div>
        <div className="text-[11px] text-neutral-500">{desc}</div>
      </div>
      <div
        className={`w-5 h-5 border-2 flex items-center justify-center ${
          enabled ? "border-emerald-600 bg-emerald-600" : "border-neutral-300 bg-white"
        }`}
      >
        {enabled && <Check className="w-3 h-3 text-white" />}
      </div>
    </button>
  );
}

// =============================================================
// Issue Modal — report a problem
// =============================================================
const ISSUE_TYPES = [
  { id: "delayed", label: "Delivery is delayed", emoji: "⏱" },
  { id: "damaged", label: "Item arrived damaged", emoji: "📦" },
  { id: "missing", label: "Wrong or missing item", emoji: "❓" },
  { id: "address", label: "Need to change address", emoji: "📍" },
  { id: "other", label: "Something else", emoji: "💬" },
];

function IssueModal({ shipment, onClose }) {
  const [type, setType] = useState("delayed");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 10) {
      return toast.error("Tell us a bit more (10+ characters)");
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onClose();
      const ticketId = `TICK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      toast.success(`Ticket ${ticketId} created`, {
        description: "We'll get back within 4 hours. You'll get an email confirmation.",
        duration: 6000,
      });
    }, 800);
  };

  return (
    <ModalShell
      testid="issue-modal"
      title="What happened?"
      subtitle={`Reporting on ${shipment.order_number}`}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-950">
            Cancel
          </button>
          <button
            data-testid="issue-submit"
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
            File Report
          </button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-2">
            Issue type
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {ISSUE_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                data-testid={`issue-${t.id}`}
                onClick={() => setType(t.id)}
                className={`flex items-center gap-3 p-2.5 border text-left transition-colors ${
                  type === t.id
                    ? "border-amber-600 bg-amber-50"
                    : "border-neutral-200 bg-white hover:border-neutral-400"
                }`}
              >
                <span className="text-lg">{t.emoji}</span>
                <span className="text-sm text-neutral-900 flex-1">{t.label}</span>
                {type === t.id && <Check className="w-4 h-4 text-amber-700" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-500 block mb-1">
            Tell us more
          </label>
          <textarea
            data-testid="issue-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full text-sm px-2 py-2 border border-neutral-300 focus:border-amber-600 outline-none resize-none"
            placeholder="Briefly describe what happened. Include dates or photos if relevant."
          />
          <div className="text-[10px] text-neutral-400 mt-1 font-mono">
            {description.trim().length} / 10 minimum
          </div>
        </div>

        <div className="text-[11px] text-neutral-500 leading-snug bg-amber-50 border border-amber-200 p-2.5">
          ⏱ Avg. resolution time: 4 hours. We'll keep you posted on every step.
        </div>
      </form>
    </ModalShell>
  );
}
