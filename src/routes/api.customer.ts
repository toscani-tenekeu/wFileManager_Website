import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const CUSTOMER_API = "https://igihzeyfgwhnuiflamvn.supabase.co/functions/v1/wfilemanager-customer-api";
const SECURITY_API = "https://igihzeyfgwhnuiflamvn.supabase.co/functions/v1/wfilemanager-customer-security-api";
const INVOICE_API = "https://igihzeyfgwhnuiflamvn.supabase.co/functions/v1/wfilemanager-invoice-api";
const COOKIE_NAME = "wfm_customer_session";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
const TIMEOUT_MS = 30_000;

function cookieValue(request: Request, name: string) {
  const cookies = request.headers.get("cookie") || "";
  for (const item of cookies.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return "";
}

function sessionCookie(token: string) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`;
}

function clearCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function sameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

const securityActions = new Set(["request-password-reset", "reset-password", "verify-email", "resend-verification"]);
const allowed = new Set([
  "register", "login", "logout", "profile", "dashboard", "me", "checkout", "renew", "auto-renew",
  "topup", "topup-status", "order", "request-password-reset", "reset-password", "verify-email",
  "resend-verification", "sessions", "invoices",
]);

async function proxy(request: Request) {
  const requestUrl = new URL(request.url);
  const action = requestUrl.searchParams.get("action") || "dashboard";
  if (!allowed.has(action)) return Response.json({ error: "Unsupported customer action" }, { status: 404 });
  if (request.method !== "GET" && !sameOrigin(request)) return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });

  const baseUrl = action === "invoices" ? INVOICE_API : securityActions.has(action) ? SECURITY_API : CUSTOMER_API;
  const upstreamUrl = new URL(`${baseUrl}/${action}`);
  for (const [key, value] of requestUrl.searchParams) if (key !== "action") upstreamUrl.searchParams.append(key, value);

  const token = cookieValue(request, COOKIE_NAME);
  const headers = new Headers({ Accept: "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    headers.set("Content-Type", request.headers.get("content-type") || "application/json");
    body = await request.arrayBuffer();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, { method: request.method, headers, body, redirect: "manual", signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return Response.json({ error: "The customer service request timed out" }, { status: 504 });
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const payload = await upstream.json().catch(() => ({})) as Record<string, unknown>;
  const responseHeaders = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });

  if ((action === "login" || action === "register") && upstream.ok && typeof payload.token === "string") {
    responseHeaders.append("Set-Cookie", sessionCookie(payload.token));
    delete payload.token;
  }
  if (action === "logout" || upstream.status === 401 || payload.currentRevoked === true) responseHeaders.append("Set-Cookie", clearCookie());

  return new Response(JSON.stringify(payload), { status: upstream.status, headers: responseHeaders });
}

export const Route = createFileRoute("/api/customer")({
  server: {
    handlers: {
      GET: ({ request }) => proxy(request),
      POST: ({ request }) => proxy(request),
      PUT: ({ request }) => proxy(request),
      DELETE: ({ request }) => proxy(request),
    },
  },
});
