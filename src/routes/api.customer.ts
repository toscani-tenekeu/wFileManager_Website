import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const CUSTOMER_API = "https://igihzeyfgwhnuiflamvn.supabase.co/functions/v1/wfilemanager-customer-api";
const INVOICE_API = "https://igihzeyfgwhnuiflamvn.supabase.co/functions/v1/wfilemanager-invoice-api";
const COOKIE_NAME = "wfm_customer_session";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

function cookieValue(request: Request, name: string) {
  const cookies = request.headers.get("cookie") || "";
  for (const item of cookies.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return "";
}

function sessionCookie(token: string) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
}

function clearCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host;
    return originUrl.host === forwardedHost;
  } catch {
    return false;
  }
}

const allowed = new Set([
  "register",
  "login",
  "logout",
  "profile",
  "dashboard",
  "me",
  "checkout",
  "renew",
  "auto-renew",
  "topup",
  "topup-status",
  "order",
  "request-password-reset",
  "reset-password",
  "verify-email",
  "resend-verification",
  "sessions",
  "invoices",
]);

async function proxy(request: Request) {
  const requestUrl = new URL(request.url);
  const action = requestUrl.searchParams.get("action") || "dashboard";
  if (!allowed.has(action)) return Response.json({ error: "Unsupported customer action" }, { status: 404 });
  if (request.method !== "GET" && !sameOrigin(request)) {
    return Response.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const baseUrl = action === "invoices" ? INVOICE_API : CUSTOMER_API;
  const upstreamUrl = new URL(`${baseUrl}/${action}`);
  for (const [key, value] of requestUrl.searchParams) {
    if (key !== "action") upstreamUrl.searchParams.append(key, value);
  }

  const token = cookieValue(request, COOKIE_NAME);
  const headers = new Headers({ Accept: "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    headers.set("Content-Type", request.headers.get("content-type") || "application/json");
    body = await request.arrayBuffer();
  }

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });
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
  if (action === "logout" || upstream.status === 401) responseHeaders.append("Set-Cookie", clearCookie());

  return new Response(JSON.stringify(payload), {
    status: upstream.status,
    headers: responseHeaders,
  });
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
