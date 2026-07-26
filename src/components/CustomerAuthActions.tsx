import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

async function securityApi(action: string, body: Record<string, unknown> = {}) {
  const response = await fetch(`/api/customer?action=${encodeURIComponent(action)}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

function passwordValid(password: string) {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export function CustomerAuthActions() {
  const [resetToken, setResetToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setResetToken(params.get("reset") || "");
  }, []);

  if (resetToken) {
    const valid = passwordValid(password) && password === confirmation;
    return (
      <div className="card-surface mx-auto max-w-xl p-6">
        <h2 className="text-lg font-semibold">Set a new customer password</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Use at least 12 characters with uppercase, lowercase and a number. Completing the reset
          revokes every existing customer session.
        </p>
        <div className="mt-5 grid gap-4">
          <div className="grid gap-1.5">
            <Label>New password</Label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Confirm password</Label>
            <Input
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>
          {message && (
            <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
              {message}
            </div>
          )}
          <Button
            type="button"
            disabled={!valid || busy}
            onClick={() =>
              void (async () => {
                setBusy(true);
                setMessage(null);
                try {
                  await securityApi("reset-password", { token: resetToken, password });
                  setMessage(
                    "Password updated. All previous sessions were revoked. Sign in with your new password.",
                  );
                  window.history.replaceState({}, "", "/account");
                  setResetToken("");
                  setPassword("");
                  setConfirmation("");
                } catch (value) {
                  setMessage(value instanceof Error ? value.message : "Password reset failed.");
                } finally {
                  setBusy(false);
                }
              })()
            }
          >
            {busy ? "Updating…" : "Update password"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <details className="card-surface p-6">
      <summary className="cursor-pointer font-semibold">Account recovery</summary>
      <div className="mt-5">
        <div>
          <h3 className="text-sm font-medium">Forgot your password?</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            A single-use reset link valid for 30 minutes will be sent when the account exists.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={busy || !/\S+@\S+\.\S+/.test(email)}
              onClick={() =>
                void (async () => {
                  setBusy(true);
                  setMessage(null);
                  try {
                    const result = await securityApi("request-password-reset", { email });
                    setMessage(result.message || "Reset instructions requested.");
                  } catch (value) {
                    setMessage(
                      value instanceof Error ? value.message : "Unable to request a reset.",
                    );
                  } finally {
                    setBusy(false);
                  }
                })()
              }
            >
              Send reset link
            </Button>
          </div>
        </div>
      </div>
      {message && (
        <div className="mt-4 rounded-md border border-border p-3 text-sm text-muted-foreground">
          {message}
        </div>
      )}
    </details>
  );
}
