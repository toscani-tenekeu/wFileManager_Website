import { useEffect, useState } from "react";
import { Button } from "./ui/button";

type Session = {
  id: string;
  user_agent?: string | null;
  ip_address?: string | null;
  last_seen_at: string;
  created_at: string;
  expires_at: string;
  current: boolean;
};

async function sessionsApi(method: "GET" | "DELETE", body?: Record<string, unknown>) {
  const response = await fetch("/api/customer?action=sessions", {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `Request failed (${response.status})`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function CustomerSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const payload = await sessionsApi("GET");
      setSessions(payload.sessions || []);
      setAvailable(true);
    } catch (value) {
      if ((value as Error & { status?: number }).status === 401) {
        setAvailable(false);
        setSessions([]);
      } else if (!silent) {
        setMessage(value instanceof Error ? value.message : "Unable to load sessions.");
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
      <summary className="cursor-pointer font-semibold">Active customer sessions</summary>
      <div className="mt-5">
        {message && <div className="mb-3 rounded-md border border-border p-3 text-sm text-muted-foreground">{message}</div>}
        <div className="divide-y divide-border">
          {loading ? <div className="py-4 text-sm text-muted-foreground">Loading sessions…</div> : sessions.length === 0 ? <div className="py-4 text-sm text-muted-foreground">No active session.</div> : sessions.map((session) => (
            <div key={session.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium">{session.current ? "Current session" : "Customer session"}</div>
                <div className="truncate text-xs text-muted-foreground">{session.user_agent || "Unknown device"}</div>
                <div className="mt-1 text-xs text-muted-foreground">IP {session.ip_address || "unknown"} · Last seen {new Date(session.last_seen_at).toLocaleString("en-US")}</div>
              </div>
              <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => void (async () => {
                setLoading(true);
                setMessage(null);
                try {
                  const result = await sessionsApi("DELETE", { id: session.id });
                  if (result.currentRevoked) window.location.assign("/account");
                  else await load(true);
                } catch (value) { setMessage(value instanceof Error ? value.message : "Unable to revoke session."); }
                finally { setLoading(false); }
              })()}>Revoke</Button>
            </div>
          ))}
        </div>
        {sessions.length > 1 && <Button className="mt-4" type="button" variant="outline" disabled={loading} onClick={() => void (async () => {
          setLoading(true);
          setMessage(null);
          try {
            await sessionsApi("DELETE", { all: true });
            window.location.assign("/account");
          } catch (value) { setMessage(value instanceof Error ? value.message : "Unable to revoke sessions."); }
          finally { setLoading(false); }
        })()}>Sign out every session</Button>}
      </div>
    </details>
  );
}
