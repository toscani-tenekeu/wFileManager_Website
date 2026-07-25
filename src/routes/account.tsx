import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MarketingLayout } from "../components/MarketingLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Licence keys — wFileManager" },
      {
        name: "description",
        content: "Buy wFileManager Pro licence keys, check payment status, renew active keys and view key status.",
      },
    ],
  }),
  component: AccountPage,
});

const CUSTOMER_API = "https://igihzeyfgwhnuiflamvn.supabase.co/functions/v1/wfilemanager-customer-api";
const TOKEN_KEY = "wfilemanager_customer_token";

type Customer = {
  email: string;
  fullName: string;
  phone?: string | null;
  company?: string | null;
  country?: string | null;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingPostalCode?: string | null;
};

type LicenceOrder = {
  orderReference: string;
  orderType?: string;
  status: string;
  keyStatus?: string | null;
  amountUsd: number;
  amountXaf: number;
  currency: string;
  paymentUrl?: string | null;
  licenceKey?: string | null;
  licenseKey?: string | null;
  activationKey?: string | null;
  keyClaimedAt?: string | null;
  keyExpiresAt?: string | null;
  keyInstanceKey?: string | null;
  paidUntil?: string | null;
  emailSentAt?: string | null;
  emailError?: boolean;
  canRenew?: boolean;
  createdAt: string;
};

type Dashboard = {
  customer: Customer;
  plan: { priceUsd: number; priceXaf: number; currency: string; periodDays: number; storageQuotaBytes: number };
  orders: LicenceOrder[];
};

const emptyForm = {
  email: "",
  password: "",
  fullName: "",
  phone: "",
  company: "",
  country: "",
  billingAddress: "",
  billingCity: "",
  billingPostalCode: "",
};

function AccountPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [token, setToken] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const authenticated = Boolean(token && dashboard?.customer);
  const visibleOrders = useMemo(
    () => (dashboard?.orders || []).filter((order) => !["failed", "cancelled"].includes(order.status)),
    [dashboard?.orders],
  );

  const formValid = useMemo(() => {
    if (mode === "login") return /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 1;
    return /\S+@\S+\.\S+/.test(form.email)
      && form.password.length >= 8
      && form.fullName.trim().length >= 2
      && form.country.trim().length >= 2
      && form.billingAddress.trim().length >= 4;
  }, [form, mode]);

  const api = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${CUSTOMER_API}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
    return payload;
  };

  const loadDashboard = async (nextToken = token) => {
    if (!nextToken) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${CUSTOMER_API}/dashboard`, {
        headers: { Authorization: `Bearer ${nextToken}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Dashboard failed (${response.status})`);
      setDashboard(payload);
      setForm((current) => ({
        ...current,
        email: payload.customer.email || current.email,
        fullName: payload.customer.fullName || "",
        phone: payload.customer.phone || "",
        company: payload.customer.company || "",
        country: payload.customer.country || "",
        billingAddress: payload.customer.billingAddress || "",
        billingCity: payload.customer.billingCity || "",
        billingPostalCode: payload.customer.billingPostalCode || "",
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load dashboard.");
      localStorage.removeItem(TOKEN_KEY);
      setToken("");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY) || "";
    if (stored) {
      setToken(stored);
      void loadDashboard(stored);
    }
  }, []);

  const setField = (field: keyof typeof emptyForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submitAuth = async () => {
    if (!formValid) return;
    setLoading(true);
    setMessage(null);
    try {
      const payload = await api(mode === "login" ? "/login" : "/register", { method: "POST", body: JSON.stringify(form) });
      localStorage.setItem(TOKEN_KEY, payload.token);
      setToken(payload.token);
      await loadDashboard(payload.token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api("/profile", { method: "PUT", body: JSON.stringify(form) });
      await loadDashboard();
      setMessage("Billing details saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile update failed.");
    } finally {
      setLoading(false);
    }
  };

  const buyKey = async () => {
    setBuying(true);
    setMessage(null);
    try {
      const payload = await api("/checkout", { method: "POST", body: JSON.stringify({ orderType: "new_licence_key" }) });
      await loadDashboard();
      if (payload.paymentUrl) window.open(payload.paymentUrl, "_blank", "noopener,noreferrer");
      setMessage("Payment link opened. After payment, return here and click Check status.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Payment link generation failed.");
    } finally {
      setBuying(false);
    }
  };

  const renewKey = async (order: LicenceOrder) => {
    if (!order.keyInstanceKey) return;
    setBuying(true);
    setMessage(null);
    try {
      const payload = await api("/renew", { method: "POST", body: JSON.stringify({ orderType: "renewal", targetInstanceKey: order.keyInstanceKey }) });
      await loadDashboard();
      if (payload.paymentUrl) window.open(payload.paymentUrl, "_blank", "noopener,noreferrer");
      setMessage("Renewal payment link opened. After payment, return here and click Check status on the renewal order.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Renewal failed.");
    } finally {
      setBuying(false);
    }
  };

  const checkStatus = async (orderReference: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const payload = await api(`/order?${new URLSearchParams({ orderReference })}`);
      await loadDashboard();
      if (payload.licenceKey || payload.licenseKey || payload.activationKey) setMessage("Payment confirmed. The licence key is available below.");
      else if (payload.status === "renewal_applied") setMessage("Renewal confirmed. The expiry date was extended.");
      else setMessage("Status refreshed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to refresh status.");
    } finally {
      setLoading(false);
    }
  };

  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  const logout = async () => {
    try { await api("/logout", { method: "POST" }); } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setDashboard(null);
    setMode("login");
  };

  return (
    <MarketingLayout>
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Licence keys</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Buy Pro keys, check payment status, copy keys, renew activated keys and view expiry dates.
              </p>
            </div>
            {authenticated && <Button type="button" variant="outline" onClick={() => void logout()}>Logout</Button>}
          </div>

          {message && <div className="mt-6 rounded-md border border-border bg-[var(--surface-1)] p-4 text-sm text-muted-foreground">{message}</div>}

          {!authenticated ? (
            <div className="mt-8 grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
              <div className="card-surface p-6">
                <h2 className="text-lg font-semibold">Customer account</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  This account is only for licence billing and product key tracking. It does not access your server.
                </p>
                <div className="mt-6 grid grid-cols-2 rounded-md border border-border p-1">
                  <button type="button" onClick={() => setMode("register")} className={`rounded px-3 py-2 text-sm ${mode === "register" ? "bg-[var(--surface-2)] text-foreground" : "text-muted-foreground"}`}>Create account</button>
                  <button type="button" onClick={() => setMode("login")} className={`rounded px-3 py-2 text-sm ${mode === "login" ? "bg-[var(--surface-2)] text-foreground" : "text-muted-foreground"}`}>Sign in</button>
                </div>
              </div>

              <div className="card-surface p-6">
                <div className="grid gap-4">
                  <Field label="Email" type="email" value={form.email} onChange={(value) => setField("email", value)} required />
                  <Field label="Password" type="password" value={form.password} onChange={(value) => setField("password", value)} required />
                  {mode === "register" && (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Full name" value={form.fullName} onChange={(value) => setField("fullName", value)} required />
                        <Field label="Phone" value={form.phone} onChange={(value) => setField("phone", value)} />
                        <Field label="Company" value={form.company} onChange={(value) => setField("company", value)} />
                        <Field label="Country" value={form.country} onChange={(value) => setField("country", value)} required />
                      </div>
                      <Field label="Billing address" value={form.billingAddress} onChange={(value) => setField("billingAddress", value)} required />
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="City" value={form.billingCity} onChange={(value) => setField("billingCity", value)} />
                        <Field label="Postal code" value={form.billingPostalCode} onChange={(value) => setField("billingPostalCode", value)} />
                      </div>
                    </>
                  )}
                  <Button type="button" onClick={() => void submitAuth()} disabled={!formValid || loading}>{loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
              <aside className="space-y-6">
                <div className="card-surface p-6">
                  <h2 className="text-lg font-semibold">{dashboard.customer.fullName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{dashboard.customer.email}</p>
                  <div className="mt-5 rounded-md border border-border bg-[var(--surface-1)] p-4 text-sm text-muted-foreground">
                    ${dashboard.plan.priceUsd} USD/year · {dashboard.plan.priceXaf} {dashboard.plan.currency} checkout · 100 MB managed application data.
                  </div>
                  <Button type="button" className="mt-5 w-full" onClick={() => void buyKey()} disabled={buying}>{buying ? "Opening payment…" : "Buy licence key"}</Button>
                </div>

                <details className="card-surface p-6">
                  <summary className="cursor-pointer text-lg font-semibold">Billing details</summary>
                  <div className="mt-5 grid gap-4">
                    <Field label="Full name" value={form.fullName} onChange={(value) => setField("fullName", value)} required />
                    <Field label="Phone" value={form.phone} onChange={(value) => setField("phone", value)} />
                    <Field label="Company" value={form.company} onChange={(value) => setField("company", value)} />
                    <Field label="Country" value={form.country} onChange={(value) => setField("country", value)} required />
                    <Field label="Billing address" value={form.billingAddress} onChange={(value) => setField("billingAddress", value)} required />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="City" value={form.billingCity} onChange={(value) => setField("billingCity", value)} />
                      <Field label="Postal code" value={form.billingPostalCode} onChange={(value) => setField("billingPostalCode", value)} />
                    </div>
                    <Button type="button" variant="outline" onClick={() => void saveProfile()} disabled={loading}>Save billing details</Button>
                  </div>
                </details>
              </aside>

              <div className="card-surface overflow-hidden p-0">
                <div className="border-b border-border p-6">
                  <h2 className="text-lg font-semibold">Product keys</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Only paid or pending product keys are shown. Failed orders are hidden.</p>
                </div>
                <div className="divide-y divide-border">
                  {visibleOrders.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground">No licence key yet.</div>
                  ) : visibleOrders.map((order) => {
                    const key = order.licenceKey || order.licenseKey || order.activationKey || "";
                    const activated = order.keyStatus === "activated";
                    const pending = ["payment_pending", "pending"].includes(order.status);
                    const renewed = order.status === "renewal_applied";
                    return (
                      <div key={order.orderReference} className="p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-xs text-muted-foreground">{order.orderReference}</div>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                              <span><span className="text-muted-foreground">Status:</span> <strong className="capitalize text-foreground">{labelStatus(order)}</strong></span>
                              {order.keyInstanceKey && <span><span className="text-muted-foreground">Instance:</span> {order.keyInstanceKey}</span>}
                            </div>
                            {key ? (
                              <div className="mt-4 rounded-md border border-border bg-[var(--surface-1)] p-3">
                                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Licence key</div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <code className="overflow-x-auto whitespace-nowrap font-mono text-sm text-foreground">{key}</code>
                                  <Button type="button" variant="outline" onClick={() => void copyKey(key)}>{copied === key ? "Copied" : "Copy"}</Button>
                                </div>
                              </div>
                            ) : pending ? (
                              <p className="mt-3 text-sm text-muted-foreground">Payment is pending. Pay, then click Check status.</p>
                            ) : renewed ? (
                              <p className="mt-3 text-sm text-muted-foreground">Renewal confirmed.</p>
                            ) : (
                              <p className="mt-3 text-sm text-muted-foreground">No visible licence key for this order.</p>
                            )}
                            <div className="mt-3 text-sm text-muted-foreground">
                              {activated && order.paidUntil && <>Expires: <span className="text-foreground">{formatDate(order.paidUntil)}</span></>}
                              {!activated && order.keyExpiresAt && <>Key expires if unused: <span className="text-foreground">{formatDate(order.keyExpiresAt)}</span></>}
                              {renewed && order.paidUntil && <>New expiry: <span className="text-foreground">{formatDate(order.paidUntil)}</span></>}
                            </div>
                            {order.emailError && <div className="mt-2 text-sm text-destructive">Email failed. The key remains available here.</div>}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {order.paymentUrl && pending && <a href={order.paymentUrl} target="_blank" rel="noreferrer" className="btn-brand btn-brand-hover inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold">Pay</a>}
                            <Button type="button" variant="outline" onClick={() => void checkStatus(order.orderReference)} disabled={loading}>Check status</Button>
                            {order.canRenew && <Button type="button" variant="outline" onClick={() => void renewKey(order)} disabled={buying}>Renew</Button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </MarketingLayout>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <div className="grid gap-1.5"><Label>{label}{required ? " *" : ""}</Label><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}
function labelStatus(order: LicenceOrder) {
  if (order.status === "renewal_applied") return "renewed";
  if (order.keyStatus === "activated") return "activated";
  if (order.keyStatus === "available") return "available";
  if (["payment_pending", "pending"].includes(order.status)) return "payment pending";
  if (order.status === "email_failed") return "key issued";
  return order.keyStatus || order.status.replace(/_/g, " ");
}
function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
