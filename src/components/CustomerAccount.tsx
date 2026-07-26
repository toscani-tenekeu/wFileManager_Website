import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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
  paymentUrl?: string | null;
  licenceKey?: string | null;
  licenseKey?: string | null;
  activationKey?: string | null;
  keyExpiresAt?: string | null;
  keyInstanceKey?: string | null;
  paidUntil?: string | null;
  emailError?: boolean;
  autoRenew?: boolean;
  canRenew?: boolean;
  storageUsedBytes?: number;
  storageQuotaBytes?: number;
  targetQuotaBytes?: number;
};
type Topup = {
  reference: string;
  status: string;
  amountUsd: number;
  paymentUrl?: string | null;
};
type Transaction = {
  id: string;
  type: string;
  amountUsd: number;
  balanceAfterUsd: number;
  createdAt: string;
};
type Dashboard = {
  customer: Customer;
  wallet: { balanceUsd: number; currency: "USD"; autoRenewDefault: boolean };
  plan: { priceUsd: number; currency: "USD"; periodDays: number; storageQuotaBytes: number };
  orders: LicenceOrder[];
  topups: Topup[];
  transactions: Transaction[];
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

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value || 0),
  );
}
function formatBytes(value: number) {
  const bytes = Math.max(0, Number(value || 0));
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${Math.round(bytes / 1024 ** 2)} MB`;
}
function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
function labelStatus(order: LicenceOrder) {
  if (order.keyStatus === "activated") return "Activated";
  if (order.keyStatus === "available") return "Ready to activate";
  if (order.status === "payment_pending" || order.status === "pending") return "Payment pending";
  if (order.status === "renewal_applied") return "Renewed";
  if (order.status === "email_failed") return "Email retry pending";
  return order.status.replace(/_/g, " ");
}
function passwordValid(password: string) {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

async function api(action: string, init: RequestInit = {}, query?: Record<string, string>) {
  const url = new URL("/api/customer", window.location.origin);
  url.searchParams.set("action", action);
  for (const [key, value] of Object.entries(query || {})) url.searchParams.set(key, value);
  const response = await fetch(url, {
    credentials: "same-origin",
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `Request failed (${response.status})`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function CustomerAccount() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState(emptyForm);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState("50");
  const [copied, setCopied] = useState<string | null>(null);
  const [quotaTargets, setQuotaTargets] = useState<Record<string, string>>({});

  const productOrders = useMemo(
    () =>
      (dashboard?.orders || []).filter(
        (order) => order.orderType !== "renewal" && !["failed", "cancelled"].includes(order.status),
      ),
    [dashboard?.orders],
  );
  const renewalOrders = useMemo(
    () =>
      (dashboard?.orders || []).filter(
        (order) => order.orderType === "renewal" && !["failed", "cancelled"].includes(order.status),
      ),
    [dashboard?.orders],
  );
  const pendingTopups = useMemo(
    () =>
      (dashboard?.topups || []).filter((item) =>
        ["pending", "payment_pending", "paid"].includes(item.status),
      ),
    [dashboard?.topups],
  );

  const fillDashboard = (payload: Dashboard) => {
    setDashboard(payload);
    setForm((current) => ({
      ...current,
      email: payload.customer.email || "",
      fullName: payload.customer.fullName || "",
      phone: payload.customer.phone || "",
      company: payload.customer.company || "",
      country: payload.customer.country || "",
      billingAddress: payload.customer.billingAddress || "",
      billingCity: payload.customer.billingCity || "",
      billingPostalCode: payload.customer.billingPostalCode || "",
      password: "",
    }));
  };

  const loadDashboard = async (silent = false) => {
    if (!silent) setBusy(true);
    try {
      const payload = await api("dashboard");
      const quotaByInstance: Record<
        string,
        { storageUsedBytes?: number; storageQuotaBytes?: number }
      > = {};
      await Promise.all(
        (payload.orders || [])
          .filter((order: LicenceOrder) => order.orderType === "storage_upgrade")
          .map(async (order: LicenceOrder) => {
            try {
              const status = await api(
                "storage-upgrade-status",
                {},
                { orderReference: order.orderReference },
              );
              if (order.keyInstanceKey) quotaByInstance[order.keyInstanceKey] = status;
            } catch {
              // A pending provider payment is expected to remain unresolved here.
            }
          }),
      );
      const orders = (payload.orders || []).map((order: LicenceOrder) => ({
        ...order,
        ...(order.keyInstanceKey ? quotaByInstance[order.keyInstanceKey] || {} : {}),
      }));
      fillDashboard({ ...payload, orders });
    } catch (value) {
      const error = value as Error & { status?: number };
      if (error.status !== 401 && !silent) setMessage(error.message);
      if (error.status === 401) setDashboard(null);
    } finally {
      if (!silent) setBusy(false);
      setInitializing(false);
    }
  };

  useEffect(() => {
    void loadDashboard(true);
  }, []);

  useEffect(() => {
    if (!dashboard || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("payment") && !params.has("reference")) return;
    const pendingOrders = dashboard.orders.filter((order) =>
      ["pending", "payment_pending", "paid", "email_failed"].includes(order.status),
    );
    const pendingFunds = dashboard.topups.filter((topup) =>
      ["pending", "payment_pending", "paid"].includes(topup.status),
    );
    void (async () => {
      setBusy(true);
      try {
        for (const order of pendingOrders) {
          const action = order.orderType === "storage_upgrade" ? "storage-upgrade-status" : "order";
          await api(action, {}, { orderReference: order.orderReference }).catch(() => null);
        }
        for (const topup of pendingFunds)
          await api("topup-status", {}, { reference: topup.reference }).catch(() => null);
        await loadDashboard(true);
        setMessage("Payment status refreshed.");
        window.history.replaceState({}, "", "/account");
      } finally {
        setBusy(false);
      }
    })();
  }, [Boolean(dashboard)]);

  const setField = (field: keyof typeof emptyForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submitAuth = async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "register" && !passwordValid(form.password)) {
        throw new Error(
          "Password must contain at least 12 characters, including uppercase, lowercase and a number.",
        );
      }
      await api(mode, { method: "POST", body: JSON.stringify(form) });
      await loadDashboard(true);
      setMessage(
        mode === "register"
          ? "Account created. Your session is secured with an HttpOnly cookie."
          : "Signed in.",
      );
    } catch (value) {
      setMessage(value instanceof Error ? value.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    try {
      await api("logout", { method: "POST", body: "{}" });
    } catch {
      /* cookie is cleared by the proxy */
    }
    setDashboard(null);
    setForm(emptyForm);
    setMode("login");
    setBusy(false);
  };

  const saveBilling = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await api("profile", { method: "PUT", body: JSON.stringify(form) });
      await loadDashboard(true);
      setMessage("Billing details saved.");
    } catch (value) {
      setMessage(value instanceof Error ? value.message : "Unable to save billing details.");
    } finally {
      setBusy(false);
    }
  };

  const buy = async (paymentMode: "balance" | "direct") => {
    setBusy(true);
    setMessage(null);
    try {
      const payload = await api("checkout", {
        method: "POST",
        body: JSON.stringify({ paymentMode }),
      });
      await loadDashboard(true);
      if (payload.paymentUrl) {
        window.location.assign(payload.paymentUrl);
      } else {
        setMessage("Licence purchased from your USD balance. The key is ready below.");
      }
    } catch (value) {
      setMessage(value instanceof Error ? value.message : "Licence purchase failed.");
    } finally {
      setBusy(false);
    }
  };

  const renew = async (order: LicenceOrder, paymentMode: "balance" | "direct") => {
    if (!order.keyInstanceKey) return;
    setBusy(true);
    setMessage(null);
    try {
      const payload = await api("renew", {
        method: "POST",
        body: JSON.stringify({ paymentMode, targetInstanceKey: order.keyInstanceKey }),
      });
      await loadDashboard(true);
      if (payload.paymentUrl) window.location.assign(payload.paymentUrl);
      else setMessage(`Renewal completed. New expiry: ${formatDate(payload.paidUntil)}.`);
    } catch (value) {
      setMessage(value instanceof Error ? value.message : "Renewal failed.");
    } finally {
      setBusy(false);
    }
  };

  const toggleAutoRenew = async (order: LicenceOrder) => {
    if (!order.keyInstanceKey) return;
    setBusy(true);
    try {
      const enabled = order.autoRenew === false;
      await api("auto-renew", {
        method: "POST",
        body: JSON.stringify({ instanceKey: order.keyInstanceKey, enabled }),
      });
      await loadDashboard(true);
      setMessage(`Automatic renewal ${enabled ? "enabled" : "disabled"}.`);
    } catch (value) {
      setMessage(value instanceof Error ? value.message : "Unable to change automatic renewal.");
    } finally {
      setBusy(false);
    }
  };

  const addFunds = async (amount = Number(topupAmount)) => {
    if (!Number.isFinite(amount) || amount < 5) {
      setMessage("Enter at least $5.00 USD.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const payload = await api("topup", {
        method: "POST",
        body: JSON.stringify({ amountUsd: amount }),
      });
      await loadDashboard(true);
      if (payload.paymentUrl) window.location.assign(payload.paymentUrl);
    } catch (value) {
      setMessage(value instanceof Error ? value.message : "Unable to create the top-up.");
    } finally {
      setBusy(false);
    }
  };

  const checkOrder = async (reference: string) => {
    setBusy(true);
    try {
      const payload = await api("order", {}, { orderReference: reference });
      await loadDashboard(true);
      setMessage(
        payload.licenceKey
          ? "Payment confirmed. The licence key is ready below."
          : `Status: ${String(payload.status || "pending").replace(/_/g, " ")}.`,
      );
    } catch (value) {
      setMessage(value instanceof Error ? value.message : "Unable to refresh payment status.");
    } finally {
      setBusy(false);
    }
  };

  const checkTopup = async (reference: string) => {
    setBusy(true);
    try {
      const payload = await api("topup-status", {}, { reference });
      await loadDashboard(true);
      setMessage(
        payload.status === "credited"
          ? `Top-up credited. Balance: ${formatUsd(payload.balanceUsd)}.`
          : `Top-up status: ${payload.status}.`,
      );
    } catch (value) {
      setMessage(value instanceof Error ? value.message : "Unable to refresh top-up status.");
    } finally {
      setBusy(false);
    }
  };

  const upgradeQuota = async (order: LicenceOrder, paymentMode: "balance" | "direct") => {
    if (!order.keyInstanceKey) return;
    const current = Number(
      order.storageQuotaBytes || dashboard?.plan.storageQuotaBytes || 104857600,
    );
    const targetMb = Number(
      quotaTargets[order.keyInstanceKey] || Math.ceil(current / 1048576) + 100,
    );
    const targetQuotaBytes = targetMb * 1048576;
    if (
      !Number.isSafeInteger(targetQuotaBytes) ||
      targetQuotaBytes <= current ||
      (targetQuotaBytes - current) % 104857600 !== 0
    ) {
      setMessage("Choose a quota greater than the current quota, in 100 MB increments.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const payload = await api("storage-upgrade", {
        method: "POST",
        body: JSON.stringify({
          paymentMode,
          instanceKey: order.keyInstanceKey,
          targetQuotaBytes,
          idempotencyKey: `quota-${order.keyInstanceKey}-${targetQuotaBytes}-${Date.now()}`,
        }),
      });
      await loadDashboard(true);
      if (payload.paymentUrl) window.location.assign(payload.paymentUrl);
      else setMessage(`Storage upgraded to ${formatBytes(payload.storageQuotaBytes)}.`);
    } catch (value) {
      setMessage(value instanceof Error ? value.message : "Storage upgrade failed.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(null), 1500);
  };

  if (initializing)
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading account…</div>;

  if (!dashboard) {
    const valid =
      mode === "login"
        ? /\S+@\S+\.\S+/.test(form.email) && form.password.length > 0
        : /\S+@\S+\.\S+/.test(form.email) &&
          passwordValid(form.password) &&
          form.fullName.trim().length >= 2 &&
          form.country.trim().length >= 2 &&
          form.billingAddress.trim().length >= 4;
    return (
      <div className="mx-auto grid max-w-4xl gap-6 py-10 md:grid-cols-[0.8fr_1.2fr]">
        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold">Customer account</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Manage licence keys, your USD balance and renewals. This account never accesses your
            server.
          </p>
          <div className="mt-6 grid grid-cols-2 rounded-md border border-border p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded px-3 py-2 text-sm ${mode === "login" ? "bg-[var(--surface-2)]" : "text-muted-foreground"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded px-3 py-2 text-sm ${mode === "register" ? "bg-[var(--surface-2)]" : "text-muted-foreground"}`}
            >
              Create account
            </button>
          </div>
          {message && (
            <div className="mt-5 rounded-md border border-border p-3 text-sm text-muted-foreground">
              {message}
            </div>
          )}
        </div>
        <div className="card-surface grid gap-4 p-6">
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => setField("email", value)}
          />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={(value) => setField("password", value)}
          />
          {mode === "register" && (
            <>
              <p className="text-xs text-muted-foreground">
                At least 12 characters with uppercase, lowercase and a number.
              </p>
              <Field
                label="Full name"
                value={form.fullName}
                onChange={(value) => setField("fullName", value)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Phone"
                  value={form.phone}
                  onChange={(value) => setField("phone", value)}
                  placeholder="+237 690 00 00 00"
                />
                <Field
                  label="Company"
                  value={form.company}
                  onChange={(value) => setField("company", value)}
                />
                <Field
                  label="Country"
                  value={form.country}
                  onChange={(value) => setField("country", value)}
                />
                <Field
                  label="City"
                  value={form.billingCity}
                  onChange={(value) => setField("billingCity", value)}
                />
              </div>
              <Field
                label="Billing address"
                value={form.billingAddress}
                onChange={(value) => setField("billingAddress", value)}
              />
              <Field
                label="Postal code"
                value={form.billingPostalCode}
                onChange={(value) => setField("billingPostalCode", value)}
              />
            </>
          )}
          <Button type="button" onClick={() => void submitAuth()} disabled={!valid || busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Signed in as</div>
          <div className="font-medium">{dashboard.customer.email}</div>
        </div>
        <Button type="button" variant="outline" onClick={() => void logout()} disabled={busy}>
          Logout
        </Button>
      </div>
      {message && (
        <div className="rounded-md border border-border bg-[var(--surface-1)] p-4 text-sm text-muted-foreground">
          {message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card-surface p-6">
          <div className="text-sm text-muted-foreground">Account balance</div>
          <div className="mt-2 text-4xl font-semibold">
            {formatUsd(dashboard.wallet.balanceUsd)}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">USD only</div>
          <div className="mt-5 flex gap-2">
            <Input
              type="number"
              min="5"
              step="1"
              value={topupAmount}
              onChange={(event) => setTopupAmount(event.target.value)}
            />
            <Button type="button" onClick={() => void addFunds()} disabled={busy}>
              Add funds
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[10, 25, 50, 100].map((amount) => (
              <button
                type="button"
                key={amount}
                onClick={() => setTopupAmount(String(amount))}
                className="rounded border border-border px-3 py-1.5 text-xs"
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>
        <div className="card-surface p-6">
          <div className="text-sm text-muted-foreground">wFileManager Pro licence</div>
          <div className="mt-2 text-3xl font-semibold">
            {formatUsd(dashboard.plan.priceUsd)} / year
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            One instance · 100 MB managed application data.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              onClick={() => void buy("balance")}
              disabled={busy || dashboard.wallet.balanceUsd < dashboard.plan.priceUsd}
            >
              Use balance
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void buy("direct")}
              disabled={busy}
            >
              Pay directly
            </Button>
          </div>
        </div>
      </div>

      {pendingTopups.length > 0 && (
        <Section title="Pending top-ups">
          {pendingTopups.map((topup) => (
            <div
              key={topup.reference}
              className="flex flex-col gap-3 border-t border-border p-5 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-medium">{formatUsd(topup.amountUsd)}</div>
                <div className="font-mono text-xs text-muted-foreground">{topup.reference}</div>
                <div className="text-sm text-muted-foreground">
                  {topup.status.replace(/_/g, " ")}
                </div>
              </div>
              <div className="flex gap-2">
                {topup.paymentUrl && (
                  <a
                    href={topup.paymentUrl}
                    className="btn-brand btn-brand-hover rounded-md px-3 py-2 text-sm font-semibold"
                  >
                    Pay
                  </a>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void checkTopup(topup.reference)}
                  disabled={busy}
                >
                  Check status
                </Button>
              </div>
            </div>
          ))}
        </Section>
      )}

      <Section
        title="Product keys"
        description="Your purchased licence keys and their activation status."
      >
        {productOrders.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No licence key yet.</div>
        ) : (
          productOrders.map((order) => {
            const key = order.licenceKey || order.licenseKey || order.activationKey || "";
            const pending =
              ["pending", "payment_pending", "paid", "email_failed"].includes(order.status) && !key;
            const activated = order.keyStatus === "activated";
            return (
              <div
                key={order.orderReference}
                className="border-t border-border p-6 first:border-t-0"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize">
                        {labelStatus(order)}
                      </span>
                      {order.keyInstanceKey && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {order.keyInstanceKey}
                        </span>
                      )}
                    </div>
                    {key && (
                      <div className="mt-4 rounded-md border border-border bg-[var(--surface-1)] p-3">
                        <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                          Licence key
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <code className="overflow-x-auto whitespace-nowrap text-sm">{key}</code>
                          <Button type="button" variant="outline" onClick={() => void copy(key)}>
                            {copied === key ? "Copied" : "Copy"}
                          </Button>
                        </div>
                      </div>
                    )}
                    {pending && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Payment confirmation is pending.
                      </p>
                    )}
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      {activated && (
                        <div>
                          Expires:{" "}
                          <span className="text-foreground">{formatDate(order.paidUntil)}</span>
                        </div>
                      )}
                      {!activated && order.keyExpiresAt && (
                        <div>
                          Activate before:{" "}
                          <span className="text-foreground">{formatDate(order.keyExpiresAt)}</span>
                        </div>
                      )}
                      {order.emailError && (
                        <div>
                          Email delivery will be retried automatically. The key remains available
                          here.
                        </div>
                      )}
                    </div>
                    {activated && order.keyInstanceKey && order.orderType !== "storage_upgrade" && (
                      <>
                        <div className="mt-4 rounded-md border border-border p-3 text-sm">
                          <div className="font-medium">Managed storage</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {formatBytes(order.storageUsedBytes || 0)} used of{" "}
                            {formatBytes(
                              order.storageQuotaBytes || dashboard.plan.storageQuotaBytes,
                            )}{" "}
                            · $1 per additional 100 MB
                          </div>
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                              type="number"
                              min={
                                Math.ceil(
                                  (order.storageQuotaBytes || dashboard.plan.storageQuotaBytes) /
                                    1048576,
                                ) + 100
                              }
                              step="100"
                              value={
                                quotaTargets[order.keyInstanceKey] ||
                                Math.ceil(
                                  (order.storageQuotaBytes || dashboard.plan.storageQuotaBytes) /
                                    1048576,
                                ) + 100
                              }
                              onChange={(event) =>
                                setQuotaTargets((current) => ({
                                  ...current,
                                  [order.keyInstanceKey!]: event.target.value,
                                }))
                              }
                            />
                            <span className="text-xs text-muted-foreground">MB target</span>
                            <Button
                              type="button"
                              onClick={() => void upgradeQuota(order, "balance")}
                              disabled={
                                busy ||
                                dashboard.wallet.balanceUsd <
                                  Math.max(
                                    1,
                                    (Number(quotaTargets[order.keyInstanceKey]) * 1048576 -
                                      Number(
                                        order.storageQuotaBytes || dashboard.plan.storageQuotaBytes,
                                      )) /
                                      104857600,
                                  )
                              }
                            >
                              Use balance
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => void upgradeQuota(order, "direct")}
                              disabled={busy}
                            >
                              Pay directly
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-3 rounded-md border border-border p-3 text-sm">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={order.autoRenew === true}
                            onClick={() => void toggleAutoRenew(order)}
                            disabled={busy}
                            className={`relative h-6 w-11 rounded-full ${order.autoRenew === true ? "bg-[var(--brand)]" : "bg-muted"}`}
                          >
                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${order.autoRenew === true ? "left-6" : "left-1"}`}
                            />
                          </button>
                          <div>
                            <div className="font-medium">Auto-renew from balance</div>
                            <div className="text-xs text-muted-foreground">
                              Explicit opt-in. The annual charge is attempted about 7 days before
                              expiry.
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.paymentUrl && pending && (
                      <a
                        href={order.paymentUrl}
                        className="btn-brand btn-brand-hover rounded-md px-3 py-2 text-sm font-semibold"
                      >
                        Pay
                      </a>
                    )}
                    {pending && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void checkOrder(order.orderReference)}
                        disabled={busy}
                      >
                        Check status
                      </Button>
                    )}
                    {order.canRenew && (
                      <Button
                        type="button"
                        onClick={() => void renew(order, "balance")}
                        disabled={busy || dashboard.wallet.balanceUsd < dashboard.plan.priceUsd}
                      >
                        Renew from balance
                      </Button>
                    )}
                    {order.canRenew && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void renew(order, "direct")}
                        disabled={busy}
                      >
                        Pay directly
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Section>

      {renewalOrders.some((order) =>
        ["pending", "payment_pending", "paid", "email_failed"].includes(order.status),
      ) && (
        <Section title="Pending renewals">
          {renewalOrders
            .filter((order) =>
              ["pending", "payment_pending", "paid", "email_failed"].includes(order.status),
            )
            .map((order) => (
              <div
                key={order.orderReference}
                className="flex flex-col gap-3 border-t border-border p-5 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium capitalize">{labelStatus(order)}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {order.orderReference}
                  </div>
                </div>
                <div className="flex gap-2">
                  {order.paymentUrl && (
                    <a
                      href={order.paymentUrl}
                      className="btn-brand btn-brand-hover rounded-md px-3 py-2 text-sm font-semibold"
                    >
                      Pay
                    </a>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void checkOrder(order.orderReference)}
                    disabled={busy}
                  >
                    Check status
                  </Button>
                </div>
              </div>
            ))}
        </Section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <details className="card-surface p-6">
          <summary className="cursor-pointer font-semibold">Transaction history</summary>
          <div className="mt-5 divide-y divide-border">
            {dashboard.transactions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No transaction yet.</div>
            ) : (
              dashboard.transactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between gap-4 py-3 text-sm">
                  <div>
                    <div className="capitalize">{transaction.type.replace(/_/g, " ")}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div>
                      {transaction.amountUsd >= 0 ? "+" : ""}
                      {formatUsd(transaction.amountUsd)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Balance {formatUsd(transaction.balanceAfterUsd)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </details>
        <details className="card-surface p-6">
          <summary className="cursor-pointer font-semibold">Billing details</summary>
          <div className="mt-5 grid gap-4">
            <Field
              label="Full name"
              value={form.fullName}
              onChange={(value) => setField("fullName", value)}
            />
            <Field
              label="Phone"
              value={form.phone}
              onChange={(value) => setField("phone", value)}
            />
            <Field
              label="Company"
              value={form.company}
              onChange={(value) => setField("company", value)}
            />
            <Field
              label="Country"
              value={form.country}
              onChange={(value) => setField("country", value)}
            />
            <Field
              label="Billing address"
              value={form.billingAddress}
              onChange={(value) => setField("billingAddress", value)}
            />
            <Field
              label="City"
              value={form.billingCity}
              onChange={(value) => setField("billingCity", value)}
            />
            <Field
              label="Postal code"
              value={form.billingPostalCode}
              onChange={(value) => setField("billingPostalCode", value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void saveBilling()}
              disabled={busy}
            >
              Save billing details
            </Button>
          </div>
        </details>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface overflow-hidden p-0">
      <div className="border-b border-border p-5">
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}
