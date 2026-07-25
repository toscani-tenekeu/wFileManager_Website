import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MarketingLayout } from "../components/MarketingLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Customer dashboard — wFileManager" },
      {
        name: "description",
        content: "Create a wFileManager customer account, manage billing details, buy Pro licence keys and track key status.",
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
  status: string;
  amountUsd: number;
  amountXaf: number;
  currency: string;
  paymentUrl?: string | null;
  paidAt?: string | null;
  activationEmailSentAt?: string | null;
  emailError?: boolean;
  licenceKey?: string | null;
  licenseKey?: string | null;
  activationKey?: string | null;
  keyIssuedAt?: string | null;
  keyStatus?: string | null;
  keyClaimedAt?: string | null;
  keyExpiresAt?: string | null;
  keyInstanceKey?: string | null;
  createdAt: string;
};

type Dashboard = {
  customer: Customer;
  plan: {
    priceUsd: number;
    priceXaf: number;
    currency: string;
    periodDays: number;
    storageQuotaBytes: number;
  };
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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const authenticated = Boolean(token && dashboard?.customer);

  const formValid = useMemo(() => {
    if (mode === "login") return /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 1;
    return (
      /\S+@\S+\.\S+/.test(form.email)
      && form.password.length >= 8
      && form.fullName.trim().length >= 2
      && form.country.trim().length >= 2
      && form.billingAddress.trim().length >= 4
    );
  }, [form, mode]);

  const setField = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

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

  const submitAuth = async () => {
    if (!formValid) return;
    setLoading(true);
    setMessage(null);
    try {
      const payload = await api(mode === "login" ? "/login" : "/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      localStorage.setItem(TOKEN_KEY, payload.token);
      setToken(payload.token);
      setDashboard({ customer: payload.customer, plan: { priceUsd: 50, priceXaf: 30000, currency: "XAF", periodDays: 365, storageQuotaBytes: 104857600 }, orders: [] });
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
      setMessage("Billing profile updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile update failed.");
    } finally {
      setLoading(false);
    }
  };

  const buyLicenceKey = async () => {
    setCheckoutLoading(true);
    setMessage(null);
    try {
      const payload = await api("/checkout", { method: "POST", body: JSON.stringify({}) });
      await loadDashboard();
      if (payload.paymentUrl) window.open(payload.paymentUrl, "_blank", "noopener,noreferrer");
      setMessage("Payment link generated. Complete the payment, then return here and click Check status to issue the licence key.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Payment link generation failed.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const refreshOrder = async (orderReference: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const payload = await api(`/order?${new URLSearchParams({ orderReference })}`);
      await loadDashboard();
      if (payload.licenceKey || payload.licenseKey || payload.activationKey) {
        setMessage("Payment confirmed. The licence key is now available in your dashboard and the email was processed once.");
      } else {
        setMessage("Payment status refreshed.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to refresh order.");
    } finally {
      setLoading(false);
    }
  };

  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      setCopiedKey(null);
    }
  };

  const logout = async () => {
    try {
      await api("/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setDashboard(null);
    setMode("login");
  };

  return (
    <MarketingLayout>
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="absolute inset-0 grid-bg" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              wFileManager customer dashboard
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground">
              Create an account, save billing details, buy Pro licence keys, check payment status and view your product keys.
            </p>
          </div>

          {message && (
            <div className="mx-auto mt-8 max-w-3xl rounded-md border border-border bg-[var(--surface-1)] p-4 text-sm text-muted-foreground">
              {message}
            </div>
          )}

          {!authenticated ? (
            <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-[0.85fr_1.15fr]">
              <div className="card-surface p-6">
                <h2 className="text-lg font-semibold">Licence account</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  This account is only for Pro licence billing and key tracking. It does not access your server or your installed wFileManager instance.
                </p>
                <div className="mt-6 grid grid-cols-2 rounded-md border border-border p-1">
                  <button type="button" onClick={() => setMode("register")} className={`rounded px-3 py-2 text-sm ${mode === "register" ? "bg-[var(--surface-2)] text-foreground" : "text-muted-foreground"}`}>
                    Create account
                  </button>
                  <button type="button" onClick={() => setMode("login")} className={`rounded px-3 py-2 text-sm ${mode === "login" ? "bg-[var(--surface-2)] text-foreground" : "text-muted-foreground"}`}>
                    Sign in
                  </button>
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
                  <Button type="button" onClick={() => void submitAuth()} disabled={!formValid || loading}>
                    {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.4fr]">
              <aside className="space-y-6">
                <div className="card-surface p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{dashboard.customer.fullName}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{dashboard.customer.email}</p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => void logout()}>
                      Logout
                    </Button>
                  </div>
                  <div className="mt-6 rounded-md border border-border bg-[var(--surface-1)] p-4 text-sm">
                    <div className="font-medium">Pro licence key</div>
                    <div className="mt-2 text-muted-foreground">
                      ${dashboard.plan.priceUsd} USD/year · {dashboard.plan.priceXaf} {dashboard.plan.currency} checkout · 100 MB managed application data.
                    </div>
                  </div>
                  <Button type="button" className="mt-5 w-full" onClick={() => void buyLicenceKey()} disabled={checkoutLoading}>
                    {checkoutLoading ? "Generating payment link…" : "Buy another licence key"}
                  </Button>
                </div>

                <div className="card-surface p-6">
                  <h2 className="text-lg font-semibold">Billing profile</h2>
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
                    <Button type="button" variant="outline" onClick={() => void saveProfile()} disabled={loading}>
                      Save billing profile
                    </Button>
                  </div>
                </div>
              </aside>

              <div className="card-surface overflow-hidden p-0">
                <div className="border-b border-border p-6">
                  <h2 className="text-lg font-semibold">Licence keys and payments</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    After payment, click Check status. If CamerPay confirms the payment, your licence key appears here and the email is processed once.
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {dashboard.orders.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground">No licence key order yet.</div>
                  ) : (
                    dashboard.orders.map((order) => {
                      const key = order.licenceKey || order.licenseKey || order.activationKey || "";
                      return (
                        <div key={order.orderReference} className="p-6">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="font-mono text-xs text-muted-foreground">{order.orderReference}</div>
                              <div className="mt-2 text-sm">
                                <span className="font-medium">${order.amountUsd} USD</span>
                                <span className="text-muted-foreground"> · {order.amountXaf} {order.currency}</span>
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground">
                                Payment status: <span className="capitalize text-foreground">{order.status.replace(/_/g, " ")}</span>
                              </div>
                              {key ? (
                                <div className="mt-4 rounded-md border border-border bg-[var(--surface-1)] p-3">
                                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Licence key</div>
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <code className="overflow-x-auto whitespace-nowrap font-mono text-sm text-foreground">{key}</code>
                                    <Button type="button" variant="outline" onClick={() => void copyKey(key)}>
                                      {copiedKey === key ? "Copied" : "Copy"}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3 text-sm text-muted-foreground">No licence key issued yet.</div>
                              )}
                              {order.activationEmailSentAt && (
                                <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">Licence key email sent.</div>
                              )}
                              {order.emailError && (
                                <div className="mt-2 text-sm text-destructive">Email delivery failed. The licence key is still shown above.</div>
                              )}
                              {order.keyStatus && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                  Key status: {order.keyStatus}
                                  {order.keyClaimedAt ? ` · claimed ${formatDate(order.keyClaimedAt)}` : ""}
                                  {order.keyExpiresAt && !order.keyClaimedAt ? ` · expires ${formatDate(order.keyExpiresAt)}` : ""}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {order.paymentUrl && !["paid", "activation_sent", "email_failed"].includes(order.status) && (
                                <a href={order.paymentUrl} target="_blank" rel="noreferrer" className="btn-brand btn-brand-hover inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold">
                                  Pay
                                </a>
                              )}
                              <Button type="button" variant="outline" onClick={() => void refreshOrder(order.orderReference)} disabled={loading}>
                                Check status
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
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
  return (
    <div className="grid gap-1.5">
      <Label>{label}{required ? " *" : ""}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
