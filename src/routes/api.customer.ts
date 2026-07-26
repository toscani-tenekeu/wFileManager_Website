import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const SUPABASE_FUNCTIONS = (
  process.env.WFILEMANAGER_SUPABASE_FUNCTIONS_URL ||
  "https://igihzeyfgwhnuiflamvn.supabase.co/functions/v1"
).replace(/\/$/, "");
const CUSTOMER_API =
  process.env.WFILEMANAGER_CUSTOMER_API_URL || `${SUPABASE_FUNCTIONS}/wfilemanager-customer-api`;
const SECURITY_API =
  process.env.WFILEMANAGER_CUSTOMER_SECURITY_API_URL ||
  `${SUPABASE_FUNCTIONS}/wfilemanager-customer-security-api`;
const FINANCIAL_API =
  process.env.WFILEMANAGER_CUSTOMER_FINANCIAL_API_URL ||
  `${SUPABASE_FUNCTIONS}/wfilemanager-customer-financial-api`;
const INVOICE_API =
  process.env.WFILEMANAGER_INVOICE_API_URL || `${SUPABASE_FUNCTIONS}/wfilemanager-invoice-api`;
const COOKIE_NAME = "wfm_customer_session";
const MAX_COOKIE_AGE = 30 * 24 * 60 * 60;
const TIMEOUT_MS = 30_000;
const MAX_BODY_BYTES = Math.max(
  16 * 1024,
  Number(process.env.WFILEMANAGER_CUSTOMER_PROXY_MAX_BODY_BYTES || 1024 * 1024),
);

function cookieValue(request: Request, name: string) {
  const cookies = request.headers.get("cookie") || "";
  for (const item of cookies.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return "";
}

function sessionCookie(token: string, expiresAt?: unknown) {
  const expiry = typeof expiresAt === "string" ? new Date(expiresAt).getTime() : NaN;
  const maxAge = Number.isFinite(expiry)
    ? Math.max(60, Math.min(MAX_COOKIE_AGE, Math.floor((expiry - Date.now()) / 1000)))
    : MAX_COOKIE_AGE;
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function clearCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function sameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

const securityActions = new Set([
  "request-password-reset",
  "reset-password",
  "verify-email",
  "resend-verification",
]);
const financialActions = new Set([
  "checkout",
  "renew",
  "auto-renew",
  "topup",
  "topup-status",
  "storage-upgrade",
  "storage-upgrade-status",
  "order",
]);
const allowed = new Set([
  "register",
  "login",
  "logout",
  "profile",
  "dashboard",
  "me",
  ...financialActions,
  ...securityActions,
  "sessions",
  "invoices",
]);

async function limitedBody(request: Request) {
  if (["GET", "HEAD"].includes(request.method)) return undefined;
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES)
    throw Object.assign(new Error("Request body is too large"), { status: 413 });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > MAX_BODY_BYTES)
    throw Object.assign(new Error("Request body is too large"), { status: 413 });
  return bytes;
}

async function proxy(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const action = requestUrl.searchParams.get("action") || "dashboard";
    if (!allowed.has(action))
      return Response.json({ error: "Unsupported customer action" }, { status: 404 });
    if (request.method !== "GET" && !sameOrigin(request))
      return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });

    const baseUrl =
      action === "invoices"
        ? INVOICE_API
        : securityActions.has(action)
          ? SECURITY_API
          : financialActions.has(action)
            ? FINANCIAL_API
            : CUSTOMER_API;
    const upstreamUrl = new URL(`${baseUrl}/${action}`);
    for (const [key, value] of requestUrl.searchParams)
      if (key !== "action") upstreamUrl.searchParams.append(key, value);

    const token = cookieValue(request, COOKIE_NAME);
    const headers = new Headers({ Accept: "application/json" });
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!["GET", "HEAD"].includes(request.method))
      headers.set("Content-Type", request.headers.get("content-type") || "application/json");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl, {
        method: request.method,
        headers,
        body: await limitedBody(request),
        redirect: "manual",
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError")
        return Response.json({ error: "The customer service request timed out" }, { status: 504 });
      throw error;
    } finally {
      clearTimeout(timer);
    }

    const payload = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;
    const responseHeaders = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });

    if (
      (action === "login" || action === "register") &&
      upstream.ok &&
      typeof payload.token === "string"
    ) {
      responseHeaders.append("Set-Cookie", sessionCookie(payload.token, payload.expiresAt));
      delete payload.token;
    }
    if (action === "logout" || upstream.status === 401 || payload.currentRevoked === true)
      responseHeaders.append("Set-Cookie", clearCookie());

    return new Response(JSON.stringify(payload), {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Customer proxy failed" },
      { status: Number((error as { status?: number }).status || 500) },
    );
  }
}

export const Route = createFileRoute("/api/customer")({
  server: {
    handlers: {
      GET: ({ request }) => proxy(request),
      POST: ({ request }) => proxy(request),
      PUT: ({ request }) => proxy(request),
      PATCH: ({ request }) => proxy(request),
      DELETE: ({ request }) => proxy(request),
    },
  },
});
