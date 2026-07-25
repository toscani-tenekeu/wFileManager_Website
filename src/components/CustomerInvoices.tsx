import { useEffect, useState } from "react";
import { Button } from "./ui/button";

type Invoice = {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  currency: "USD";
  amountUsd: number;
  issuedAt: string;
  downloadUrl?: string | null;
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

export function CustomerInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/customer?action=invoices", { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setInvoices(payload.invoices || []);
        setAvailable(true);
        setError(null);
      } else if (response.status === 401) {
        setAvailable(false);
        setInvoices([]);
      } else if (!silent) {
        setError(payload.error || "Unable to load invoices.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 15_000);
    const focus = () => void load(true);
    window.addEventListener("focus", focus);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", focus); };
  }, []);

  if (!available && !loading) return null;

  return (
    <details className="card-surface p-6">
      <summary className="cursor-pointer font-semibold">Invoices and receipts</summary>
      <div className="mt-5 divide-y divide-border">
        {error && <div className="mb-3 rounded-md border border-border p-3 text-sm text-muted-foreground">{error}</div>}
        {loading ? <div className="py-4 text-sm text-muted-foreground">Preparing documents…</div> : invoices.length === 0 ? (
          <div className="py-4 text-sm text-muted-foreground">No invoice yet.</div>
        ) : invoices.map((invoice) => (
          <div key={invoice.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-mono text-sm">{invoice.invoiceNumber}</div>
              <div className="mt-1 text-xs capitalize text-muted-foreground">
                {invoice.type.replace(/_/g, " ")} · {formatUsd(invoice.amountUsd)} · {new Date(invoice.issuedAt).toLocaleDateString("en-US")}
              </div>
            </div>
            {invoice.downloadUrl && <Button asChild type="button" variant="outline" size="sm"><a href={invoice.downloadUrl}>Download PDF</a></Button>}
          </div>
        ))}
      </div>
    </details>
  );
}
