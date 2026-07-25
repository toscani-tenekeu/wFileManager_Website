import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MarketingLayout } from "../components/MarketingLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Licence keys and balance — wFileManager" },
      {
        name: "description",
        content: "Manage your USD account balance, wFileManager Pro licence keys, renewals and top-ups.",
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
  balanceUsd?: number;
  autoRenewDefault?: boolean;
};

type LicenceOrder = {
  orderReference: string;
  orderType?: string;
  status: string;
  keyStatus?: string | null;
  amountUsd: number;
  paymentUrl?: string | null;
  paymentMethod?: string | null;
  licenceKey?: string | null;
  licenseKey?: string | null;
  activationKey?: string | null;
  keyClaimedAt?: string | null;
  keyExpiresAt?: string | null;
  keyInstanceKey?: string | null;
  paidUntil?: string | null;
  emailSentAt?: string | null;
  emailError?: boolean;
  autoRenew?: boolean;
  canRenew?: boolean;
  createdAt: string;
};

type Topup = {
  reference: string;
  status: string;
  amountUsd: number;
  paymentUrl?: string | null;
  paidAt?: string | null;
  creditedAt?: string | null;
  emailError?: boolean;
  createdAt: string;
};

type WalletTransaction = {
  id: string;
  type: string;
  amountUsd: number;
  balanceAfterUsd: number;
  reference?: string | null;
  createdAt: string;
};

type Dashboard = {
  customer: Customer;
  wallet: { balanceUsd: number; currency: "USD"; autoRenewDefault: boolean };
  plan: { priceUsd: number; currency: "USD"; periodDays: number; storageQuotaBytes: number };
  orders: LicenceOrder[];
  topups: Topup[];
  transactions: WalletTransaction[];
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
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState("50");

  const authenticated = Boolean(token && dashboard?.customer);
  const productOrders = useMemo(
    () => (dashboard?.orders || []).filter((order) => order.orderType !== "renewal" && !["failed", "cancelled"].includes(order.status)),
    [dashboard?.orders],
  );
  const pendingTopups = useMemo(
    () => (dashboard?.topups || []).filter((topup) => ["pending", "payment_pending", "paid"].includes(topup.status)),
    [dashboard?.topups],
  );

  const formValid = useMemo(() => {
    if (mode === "login") return /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 1;
    return /\S+@\S+\.\S+/.test(form.email)
      && form.password.length >= 8
      && form.fullName.trim().length >= 2
      && form.country.trim().length >= 2
      && form.billingAddress.trim().length >= 4;
  }, [form, mode]);

  const api = async (path: string, init: RequestInit = {}, explicitToken = token) => {
    const response = await fetch(`${CUSTOMER_API}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(explicitToken ? { Authorization: `Bearer ${explicitToken}` } : {}),
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
    try {
      const payload = await api("/dashboard", {}, nextToken);
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
      setMessage(error instanceof Error ? error.message : "Unable to load the account.");
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
      const payload = await api(mode === "login" ? "/login" : "/register", {
        method: "POST",
        body: JSON.stringify(form),
      }, "");
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

  const buyKey = async (paymentMode: "balance" | "direct") => {
    setActionLoading(true);
    setMessage(null);
    try {
      const payload = await api("/checkout", {
        method: "POST",
        body: JSON.stringify({ paymentMode }),
      });
      await loadDashboard();
      if (payload.paymentUrl) {
        window.open(payload.paymentUrl, "_blank", "noopener,noreferrer");
        setMessage("Payment page opened. After payment, return here and click Check status.");
      } else {
        setMessage("Licence purchased from your account balance. The key is available below.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Licence purchase failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const renewKey = async (order: LicenceOrder, paymentMode: "balance" | "direct") => {
    if (!order.keyInstanceKey) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const payload = await api("/renew", {
        method: "POST",
        body: JSON.stringify({ paymentMode, targetInstanceKey: order.keyInstanceKey }),
      });
      await loadDashboard();
      if (payload.paymentUrl) {
        window.open(payload.paymentUrl, "_blank", "noopener,noreferrer");
        setMessage("Renewal payment page opened. After payment, return here and check the renewal order status.");
      } else {
        setMessage(`Renewal completed from your account balance. New expiry: ${formatDate(payload.paidUntil)}.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Renewal failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleAutoRenew = async (order: LicenceOrder) => {
    if (!order.keyInstanceKey) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const enabled = order.autoRenew === false;
      await api("/auto-renew", {
        method: "POST",
        body: JSON.stringify({ instanceKey: order.keyInstanceKey, enabled }),
      });
      await loadDashboard();
      setMessage(`Automatic renewal from account balance ${enabled ? "enabled" : "disabled"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to change automatic renewal.");
    } finally {
      setActionLoading(false);
    }
  };

  const addFunds = async (amount = Number(topupAmount)) => {
    if (!Number.isFinite(amount) || amount < 5) {
      setMessage("Enter an amount of at least $5.00 USD.");
      return;
    }
    setActionLoading(true);
    setMessage(null);
    try {
      const payload = await api("/topup", {
        method: "POST",
        body: JSON.stringify({ amountUsd: amount }),
      });
      await loadDashboard();
      if (payload.paymentUrl) window.open(payload.paymentUrl, "_blank", "noopener,noreferrer");
      setMessage("Top-up payment page opened. After payment, return here and click Check top-up.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create the top-up.");
    } finally {
      setActionLoading(false);
    }
  };

  const checkTopup = async (reference: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const payload = await api(`/topup-status?${new URLSearchParams({ reference })}`);
      await loadDashboard();
      setMessage(payload.status === "credited"
        ? `Top-up credited. Balance: ${formatUsd(payload.balanceUsd)}.`
        : `Top-up status: ${String(payload.status).replace(/_/g, " ")}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to check the top-up.");
    } finally {
      setActionLoading(false);
    }
  };

  const checkStatus = async (orderReference: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const payload = await api(`/order?${new URLSearchParams({ orderReference })}`);
      await loadDashboard();
      if (payload.licenceKey || payload.licenseKey || payload.activationKey) {
        setMessage("Payment confirmed. The licence key is available below.");
      } else if (payload.status === "renewal_applied") {
        setMessage("Renewal confirmed. The expiry date was extended.");
      } else {
        setMessage(`Status: ${String(payload.status || "pending").replace(/_/g, " ")}.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to refresh the status.");
    } finally {
      setActionLoading(false);
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
        <div className="mx-auto max-w-5xl px-4 py-14 md:py-18">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Licence keys</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                View your product keys, USD balance, activation status, expiry and renewals.
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
                  This account manages licence keys, balance and payments. It does not access your server.
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
            <div className="mt-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="card-surface p-6">
                  <div className="text-sm text-muted-foreground">Account balance</div>
                  <div className="mt-2 text-4xl font-semibold tracking-tight">{formatUsd(dashboard.wallet.balanceUsd)}</div>
                  <div className="mt-1 text-sm text-muted-foreground">USD only</div>
                  <div className="mt-5 flex gap-2">
                    <Input type="number" min="5" step="1" value={topupAmount} onChange={(event) => setTopupAmount(event.target.value)} aria-label="Top-up amount in USD" />
                    <Button type="button" onClick={() => void addFunds()} disabled={actionLoading}>Add funds</Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[10, 25, 50, 100].map((amount) => (
                      <button key={amount} type="button" className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={() => { setTopupAmount(String(amount)); void addFunds(amount); }}>
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card-surface p-6">
                  <div className="text-sm text-muted-foreground">wFileManager Pro licence</div>
                  <div className="mt-2 text-3xl font-semibold">{formatUsd(dashboard.plan.priceUsd)} / year</div>
                  <p className="mt-3 text-sm text-muted-foreground">One instance · 100 MB managed application data.</p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <Button type="button" onClick={() => void buyKey("balance")} disabled={actionLoading || dashboard.wallet.balanceUsd < dashboard.plan.priceUsd}>Use balance</Button>
                    <Button type="button" variant="outline" onClick={() => void buyKey("direct")} disabled={actionLoading}>Pay directly</Button>
                  </div>
                </div>
              </div>

              {pendingTopups.length > 0 && (
                <div className="card-surface overflow-hidden p-0">
                  <div className="border-b border-border p-5"><h2 className="font-semibold">Pending top-ups</h2></div>
                  <div className="divide-y divide-border">
                    {pendingTopups.map((topup) => (
                      <div key={topup.reference} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-medium">{formatUsd(topup.amountUsd)}</div>
                          <div className="mt-1 font-mono text-xs text-muted-foreground">{topup.reference}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{topup.status.replace(/_/g, " ")}</div>
                        </div>
                        <div className="flex gap-2">
                          {topup.paymentUrl && topup.status === "payment_pending" && <a href={topup.paymentUrl} target="_blank" rel="noreferrer" className="btn-brand btn-brand-hover inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold">Pay</a>}
                          <Button type="button" variant="outline" onClick={() => void checkTopup(topup.reference)} disabled={actionLoading}>Check top-up</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card-surface overflow-hidden p-0">
                <div className="border-b border-border p-6">
                  <h2 className="text-lg font-semibold">Product keys</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Keys are shown in clear text with activation and expiry status.</p>
                </div>
                <div className="divide-y divide-border">
                  {productOrders.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground">No licence key yet.</div>
                  ) : productOrders.map((order) => {
                    const key = order.licenceKey || order.licenseKey || order.activationKey || "";
                    const activated = order.keyStatus === "activated";
                    const pending = ["payment_pending", "pending"].includes(order.status);
                    return (
                      <div key={order.orderReference} className="p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge status={labelStatus(order)} />
                              {order.keyInstanceKey && <span className="font-mono text-xs text-muted-foreground">{order.keyInstanceKey}</span>}
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
                              <p className="mt-3 text-sm text-muted-foreground">Payment is pending.</p>
                            ) : (
                              <p className="mt-3 text-sm text-muted-foreground">The key has not been issued yet.</p>
                            )}

                            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                              {activated && order.paidUntil && <div>Expires: <span className="text-foreground">{formatDate(order.paidUntil)}</span></div>}
                              {!activated && order.keyExpiresAt && <div>Activate before: <span className="text-foreground">{formatDate(order.keyExpiresAt)}</span></div>}
                              {order.emailError && <div className="text-destructive">Email delivery failed. The key remains available here.</div>}
                            </div>

                            {activated && order.keyInstanceKey && (
                              <div className="mt-4 flex items-center gap-3 rounded-md border border-border p-3 text-sm">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={order.autoRenew !== false}
                                  onClick={() => void toggleAutoRenew(order)}
                                  disabled={actionLoading}
                                  className={`relative h-6 w-11 rounded-full transition ${order.autoRenew !== false ? "bg-[var(--brand)]" : "bg-muted"}`}
                                >
                                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${order.autoRenew !== false ? "left-6" : "left-1"}`} />
                                </button>
                                <div>
                                  <div className="font-medium text-foreground">Auto-renew from balance</div>
                                  <div className="text-xs text-muted-foreground">The system attempts to charge {formatUsd(dashboard.plan.priceUsd)} about 7 days before expiry.</div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {order.paymentUrl && pending && <a href={order.paymentUrl} target="_blank" rel="noreferrer" className="btn-brand btn-brand-hover inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold">Pay</a>}
                            {pending && <Button type="button" variant="outline" onClick={() => void checkStatus(order.orderReference)} disabled={actionLoading}>Check status</Button>}
                            {order.canRenew && <Button type="button" onClick={() => void renewKey(order, "balance")} disabled={actionLoading || dashboard.wallet.balanceUsd < dashboard.plan.priceUsd}>Renew from balance</Button>}
                            {order.canRenew && <Button type="button" variant="outline" onClick={() => void renewKey(order, "direct")} disabled={actionLoading}>Pay renewal directly</Button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <details className="card-surface p-6">
                  <summary className="cursor-pointer font-semibold">Transaction history</summary>
                  <div className="mt-5 divide-y divide-border">
                    {dashboard.transactions.length === 0 ? <div className="text-sm text-muted-foreground">No transaction yet.</div> : dashboard.transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                        <div>
                          <div className="capitalize">{transaction.type.replace(/_/g, " ")}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</div>
                        </div>
                        <div className="text-right">
                          <div className={transaction.amountUsd >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-foreground"}>{transaction.amountUsd >= 0 ? "+" : ""}{formatUsd(transaction.amountUsd)}</div>
                          <div className="text-xs text-muted-foreground">Balance {formatUsd(transaction.balanceAfterUsd)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>

                <details className="card-surface p-6">
                  <summary className="cursor-pointer font-semibold">Billing details</summary>
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

function StatusBadge({ status }: { status: string }) {
  return <span className="rounded-full border border-border bg-[var(--surface-1)] px-2.5 py-1 text-xs font-medium capitalize text-foreground">{status}</span>;
}

function labelStatus(order: LicenceOrder) {
  if (order.keyStatus === "activated") return "activated";
  if (order.keyStatus === "available") return "not activated";
  if (["payment_pending", "pending"].includes(order.status)) return "payment pending";
  if (order.status === "email_failed") return "key issued";
  return order.keyStatus || order.status.replace(/_/g, " ");
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
