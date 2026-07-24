import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MarketingLayout } from "../components/MarketingLayout";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — wFileManager" },
      {
        name: "description",
        content:
          "Choose Community for free SQLite storage on your server, or purchase Pro managed application data for $50 USD per instance per year.",
      },
    ],
  }),
  component: PricingPage,
});

const SUPPORT_EMAIL = "support@kmerhosting.com";
const PRO_SUBSCRIPTION_API = "https://igihzeyfgwhnuiflamvn.supabase.co/functions/v1/wfilemanager-pro-subscription-api";

type CheckoutResponse = {
  orderReference: string;
  paymentUrl: string;
  amountUsd: number;
  amountXaf: number;
  currency: string;
  status: string;
};

type OrderStatus = {
  orderReference: string;
  status: string;
  paymentUrl?: string | null;
  paidAt?: string | null;
  activationEmailSentAt?: string | null;
  emailError?: boolean;
};

const initialBilling = {
  buyerName: "",
  buyerEmail: "",
  buyerPhone: "",
  buyerCompany: "",
  buyerCountry: "",
  billingAddress: "",
  billingCity: "",
  billingPostalCode: "",
};

function PricingPage() {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [billing, setBilling] = useState(initialBilling);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const billingValid = useMemo(() => (
    billing.buyerName.trim().length >= 2
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.buyerEmail.trim())
      && billing.buyerPhone.trim().length >= 6
      && billing.buyerCountry.trim().length >= 2
      && billing.billingAddress.trim().length >= 4
  ), [billing]);

  const paymentDone = order && ["paid", "activation_sent", "email_failed"].includes(order.status);
  const emailSent = Boolean(order?.activationEmailSentAt || order?.status === "activation_sent");

  const updateField = (field: keyof typeof initialBilling, value: string) => {
    setBilling((current) => ({ ...current, [field]: value }));
  };

  const resetPurchase = () => {
    setCheckout(null);
    setOrder(null);
    setError(null);
    setSubmitting(false);
    setChecking(false);
  };

  const openPurchase = () => {
    resetPurchase();
    setPurchaseOpen(true);
  };

  const createCheckout = async () => {
    if (!billingValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${PRO_SUBSCRIPTION_API}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billing),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Payment link failed (${response.status})`);
      setCheckout(payload);
      setOrder({ orderReference: payload.orderReference, status: payload.status, paymentUrl: payload.paymentUrl });
    } catch (value) {
      setError(value instanceof Error ? value.message : "Unable to create the payment link.");
    } finally {
      setSubmitting(false);
    }
  };

  const refreshOrder = async () => {
    if (!checkout?.orderReference || !billing.buyerEmail.trim()) return;
    setChecking(true);
    try {
      const query = new URLSearchParams({ orderReference: checkout.orderReference, email: billing.buyerEmail.trim() });
      const response = await fetch(`${PRO_SUBSCRIPTION_API}/order?${query.toString()}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Order check failed (${response.status})`);
      setOrder(payload);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Unable to check payment status.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!checkout || paymentDone) return;
    const timer = window.setInterval(() => void refreshOrder(), 5000);
    return () => window.clearInterval(timer);
  }, [checkout?.orderReference, paymentDone]);

  return (
    <MarketingLayout>
      <main className="min-h-screen bg-background text-foreground">
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 grid-bg" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-32">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
                Choose your wFileManager edition
              </h1>
              <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                Both editions include the same file-manager features. The difference is where wFileManager stores its own application records and who is responsible for backup, recovery and billing.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
              <article className="card-surface relative flex flex-col overflow-hidden p-8 pt-10">
                <Ribbon>SQLite on your server</Ribbon>
                <h2 className="pr-24 text-xl font-semibold">Community</h2>

                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-tight">$0</span>
                  <span className="pb-1 text-sm text-muted-foreground">USD</span>
                </div>
                <p className="mt-2 text-sm font-medium brand-text">Free forever · No paid licence required</p>

                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  Community stores wFileManager users, roles, sessions, authentication records, notifications and settings locally in SQLite on your server.
                </p>

                <ul className="mt-7 space-y-3 pb-8 text-sm text-muted-foreground">
                  <Feature>All wFileManager features</Feature>
                  <Feature>SQLite stored at /var/lib/wfilemanager/wfilemanager.db</Feature>
                  <Feature>Application records remain on your server</Feature>
                  <Feature>You manage backups, restores, migrations and maintenance</Feature>
                  <Feature>Uninstall removes local SQLite data and configuration</Feature>
                  <Feature>Community support</Feature>
                </ul>

                <a
                  href="/#install"
                  className="btn-ghost btn-ghost-hover mt-auto inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold"
                >
                  Install Community
                </a>
              </article>

              <article className="card-surface relative flex flex-col overflow-hidden p-8 pt-10">
                <Ribbon accent>Paid activation</Ribbon>
                <h2 className="pr-20 text-xl font-semibold">Pro</h2>

                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-tight">$50</span>
                  <span className="pb-1 text-sm text-muted-foreground">USD / year</span>
                </div>
                <p className="mt-2 text-sm font-medium brand-text">
                  Per instance · 100 MB included
                </p>

                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  Pro stores wFileManager application records in managed infrastructure with backups, recovery metadata and support for server reinstall or replacement. A paid activation token is required before first setup.
                </p>

                <ul className="mt-7 space-y-3 pb-8 text-sm text-muted-foreground">
                  <Feature>All wFileManager features</Feature>
                  <Feature>Managed users, roles, sessions and authentication records</Feature>
                  <Feature>Automatic backups of wFileManager application data</Feature>
                  <Feature>Recovery Kit reconnects a replacement installation</Feature>
                  <Feature>100 MB included, then $1 USD/year per additional 100 MB</Feature>
                  <Feature>Unpaid +7 days: account suspended</Feature>
                  <Feature>Unpaid +30 days: managed data and account deleted</Feature>
                  <Feature>Uninstall can be local-only or permanent Pro deletion</Feature>
                  <Feature>Priority support</Feature>
                </ul>

                <button
                  type="button"
                  onClick={openPurchase}
                  className="btn-brand btn-brand-hover mt-auto inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold"
                >
                  Purchase Pro
                </button>
              </article>
            </div>

            <div className="mx-auto mt-8 grid max-w-4xl gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-[var(--surface-1)] p-6">
                <h2 className="text-sm font-semibold text-foreground">What Pro stores</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Pro covers records used by wFileManager itself: application users, roles, sessions, authentication records, notifications, settings, backup metadata and recovery metadata.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-[var(--surface-1)] p-6">
                <h2 className="text-sm font-semibold text-foreground">What neither edition stores</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  wFileManager does not store or back up your server filesystem files, websites, databases, uploads or directories. Those remain on your server and require a separate backup policy.
                </p>
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-4xl rounded-lg border border-border bg-[var(--surface-1)] p-5 text-center text-sm text-muted-foreground">
              Pro costs $50 USD per instance per year and includes 100 MB of managed application storage. Payment creates a Pro activation token. If payment is more than 7 days overdue, the Pro account is suspended; if payment is more than 30 days overdue, managed application data and the account are deleted. Read the{" "}
              <a href="/terms" className="font-medium brand-text hover:underline">Terms of Use</a>
              {" "}or contact{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium brand-text hover:underline">
                {SUPPORT_EMAIL}
              </a>
              {" "}for storage expansion or billing questions.
            </div>
          </div>
        </section>
      </main>

      <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase wFileManager Pro</DialogTitle>
            <DialogDescription>
              Enter billing details, generate a secure payment link, then complete payment. After confirmation, the activation token is sent by email.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!checkout && (
            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Full name" value={billing.buyerName} onChange={(value) => updateField("buyerName", value)} required />
                <Field label="Billing email" type="email" value={billing.buyerEmail} onChange={(value) => updateField("buyerEmail", value)} required />
                <Field label="Phone" value={billing.buyerPhone} onChange={(value) => updateField("buyerPhone", value)} required />
                <Field label="Company" value={billing.buyerCompany} onChange={(value) => updateField("buyerCompany", value)} />
                <Field label="Country" value={billing.buyerCountry} onChange={(value) => updateField("buyerCountry", value)} required />
                <Field label="City" value={billing.billingCity} onChange={(value) => updateField("billingCity", value)} />
              </div>
              <Field label="Billing address" value={billing.billingAddress} onChange={(value) => updateField("billingAddress", value)} required />
              <Field label="Postal code" value={billing.billingPostalCode} onChange={(value) => updateField("billingPostalCode", value)} />
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                $50 USD per instance/year. The payment provider may charge in XAF. 100 MB managed application-data storage is included.
              </div>
            </div>
          )}

          {checkout && (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
                <div className="grid gap-2 md:grid-cols-3">
                  <span className="text-muted-foreground">Order</span>
                  <span className="md:col-span-2 font-mono text-xs">{checkout.orderReference}</span>
                  <span className="text-muted-foreground">Amount</span>
                  <span className="md:col-span-2">${checkout.amountUsd} USD · {checkout.amountXaf} {checkout.currency}</span>
                  <span className="text-muted-foreground">Status</span>
                  <span className="md:col-span-2 capitalize">{order?.status?.replace(/_/g, " ") || checkout.status}</span>
                </div>
              </div>

              {paymentDone ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                  Payment received. {emailSent ? "The activation token was sent to your billing email." : "The activation email is being processed."}
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href={checkout.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-brand btn-brand-hover inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold"
                  >
                    Open payment link
                  </a>
                  <Button type="button" variant="outline" onClick={() => void refreshOrder()} disabled={checking}>
                    {checking ? "Checking…" : "Check payment status"}
                  </Button>
                </div>
              )}

              <p className="text-sm leading-relaxed text-muted-foreground">
                If payment succeeds but you do not receive the activation email within 5 to 15 minutes, contact {SUPPORT_EMAIL} with your billing email and the approximate payment time.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPurchaseOpen(false)}>
              Close
            </Button>
            {!checkout && (
              <Button type="button" onClick={() => void createCheckout()} disabled={!billingValid || submitting}>
                {submitting ? "Generating…" : "Generate payment link"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MarketingLayout>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}{required ? " *" : ""}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function Ribbon({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <div
      className={`absolute -right-12 top-7 w-44 rotate-45 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.16em] shadow-sm ${
        accent
          ? "bg-[var(--brand)] text-[var(--primary-foreground)]"
          : "border-y border-border bg-[var(--surface-2)] text-muted-foreground"
      }`}
    >
      {children}
    </div>
  );
}

function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 h-4 w-4 shrink-0 brand-text"
        aria-hidden
      >
        <path d="M5 12l5 5L20 7" />
      </svg>
      <span>{children}</span>
    </li>
  );
}
