import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-camerpay-signature, x-signature, signature",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Cache-Control": "no-store",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabase = createClient(
  supabaseUrl,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const encoder = new TextEncoder();
const CAMERPAY_DASHBOARD_CALLBACK_URL = "https://kmerhosting.com/api/webhooks/camerpay";
const CAMERPAY_DASHBOARD_RETURN_URL = "https://kmerhosting.com/payment/top-up/return";

type SubscriptionConfig = {
  camerpayApiBaseUrl: string;
  camerpayApiToken: string;
  camerpayWebhookSecret: string;
  camerpayPaymentMethod: string;
  mailtrapApiToken: string;
  mailtrapApiUrl: string;
  mailtrapFromEmail: string;
  mailtrapFromName: string;
  siteUrl: string;
  functionUrl: string;
  supportEmail: string;
  priceUsd: number;
  priceXaf: number;
  currency: string;
  storageQuotaBytes: number;
  periodDays: number;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomHex(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes).toUpperCase();
}

async function sha256(value: string) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

async function hmacHex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToHex(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

async function loadConfig(): Promise<SubscriptionConfig> {
  const { data, error } = await supabase
    .from("wfilemanager_pro_subscription_config")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("wFileManager Pro subscription configuration is missing");

  return {
    camerpayApiBaseUrl: String(data.camerpay_api_base_url || "https://camerpay.biz").replace(/\/$/, ""),
    camerpayApiToken: String(data.camerpay_api_token || ""),
    camerpayWebhookSecret: String(data.camerpay_webhook_secret || ""),
    camerpayPaymentMethod: String(data.camerpay_payment_method || "auto"),
    mailtrapApiToken: String(data.mailtrap_api_token || ""),
    mailtrapApiUrl: String(data.mailtrap_api_url || "https://send.api.mailtrap.io/api/send"),
    mailtrapFromEmail: String(data.mailtrap_from_email || "support@kmerhosting.com"),
    mailtrapFromName: String(data.mailtrap_from_name || "KmerHosting"),
    siteUrl: String(data.site_url || "https://wfilemanager.com").replace(/\/$/, ""),
    functionUrl: String(data.function_url || `${supabaseUrl}/functions/v1/wfilemanager-pro-subscription-api`).replace(/\/$/, ""),
    supportEmail: String(data.support_email || "support@kmerhosting.com"),
    priceUsd: Number(data.price_usd || 50),
    priceXaf: Number(data.price_xaf || 30000),
    currency: String(data.currency || "XAF"),
    storageQuotaBytes: Number(data.storage_quota_bytes || 104857600),
    periodDays: Number(data.period_days || 365),
  };
}

async function verifyWebhookSignature(config: SubscriptionConfig, request: Request, rawBody: string) {
  if (!config.camerpayWebhookSecret) return true;
  const signature = request.headers.get("x-camerpay-signature")
    || request.headers.get("x-signature")
    || request.headers.get("signature")
    || "";
  const normalized = signature.toLowerCase().replace(/^sha256=/, "").trim();
  if (!normalized) return false;
  return normalized === await hmacHex(config.camerpayWebhookSecret, rawBody);
}

function emailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function normalizeCameroonPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("6")) return `237${digits}`;
  if (digits.length === 12 && digits.startsWith("237")) return digits;
  return digits;
}

function orderReference() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `WFM-PRO-${stamp}-${randomHex(4)}-${randomHex(4)}`;
}

function pick(obj: Record<string, unknown>, paths: string[]) {
  for (const path of paths) {
    let current: unknown = obj;
    for (const key of path.split(".")) {
      if (!current || typeof current !== "object") {
        current = undefined;
        break;
      }
      current = (current as Record<string, unknown>)[key];
    }
    if (current !== undefined && current !== null && String(current).trim() !== "") return current;
  }
  return undefined;
}

function paymentUrlFrom(payload: Record<string, unknown>) {
  return clean(pick(payload, [
    "pay_url",
    "payUrl",
    "payment_url",
    "paymentUrl",
    "checkout_url",
    "checkoutUrl",
    "redirect_url",
    "redirectUrl",
    "url",
    "link",
    "data.pay_url",
    "data.payUrl",
    "data.payment_url",
    "data.paymentUrl",
    "data.checkout_url",
    "data.redirect_url",
    "data.url",
    "data.link",
  ]));
}

function providerRefFrom(payload: Record<string, unknown>) {
  return clean(pick(payload, [
    "transaction_uuid",
    "uuid",
    "reference",
    "transaction_id",
    "transactionId",
    "payment_id",
    "paymentId",
    "data.transaction_uuid",
    "data.uuid",
    "data.reference",
    "data.transaction_id",
    "data.payment_id",
  ]));
}

function invoiceFromWebhook(payload: Record<string, unknown>) {
  return clean(pick(payload, [
    "merchant_invoice_id",
    "merchantInvoiceId",
    "idempotency_key",
    "invoice_id",
    "invoiceId",
    "order_reference",
    "orderReference",
    "data.merchant_invoice_id",
    "data.merchantInvoiceId",
    "data.idempotency_key",
    "data.invoice_id",
    "data.order_reference",
  ]));
}

function statusFromWebhook(payload: Record<string, unknown>) {
  return clean(pick(payload, ["status", "payment_status", "paymentStatus", "data.status", "data.payment_status"])).toLowerCase();
}

function amountFromWebhook(payload: Record<string, unknown>) {
  const amount = Number(pick(payload, ["amount", "paid_amount", "data.amount", "data.paid_amount"]));
  return Number.isFinite(amount) ? amount : null;
}

function isPaidStatus(status: string) {
  return ["paid", "success", "successful", "completed", "approved", "confirmed", "succeeded", "done", "vire", "viré"].includes(status);
}

function camerPayErrorMessage(status: number, payload: Record<string, unknown>) {
  const message = clean(payload.message || payload.error) || `CamerPay failed (${status})`;
  const errors = payload.errors ? ` ${JSON.stringify(payload.errors)}` : "";
  return `CamerPay failed (${status}): ${message}${errors}`;
}

async function createCamerPayLink(config: SubscriptionConfig, order: Record<string, unknown>) {
  if (!config.camerpayApiToken) throw new Error("CamerPay API token is not configured");

  const paymentMethod = config.camerpayPaymentMethod.toLowerCase();
  const body: Record<string, unknown> = {
    amount: order.amount_xaf,
    currency: order.currency,
    customer_phone: order.buyer_phone,
    customer_name: order.buyer_name,
    customer_email: order.buyer_email,
    merchant_invoice_id: order.order_reference,
    merchant_callback_url: CAMERPAY_DASHBOARD_CALLBACK_URL,
    merchant_return_url: CAMERPAY_DASHBOARD_RETURN_URL,
    idempotency_key: order.order_reference,
    source: "api",
  };

  if (["orange_money", "mtn_momo", "stripe", "paypal"].includes(paymentMethod)) {
    body.payment_method = paymentMethod;
  }

  const response = await fetch(`${config.camerpayApiBaseUrl}/api/payment/initiate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.camerpayApiToken}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(camerPayErrorMessage(response.status, payload));

  const paymentUrl = paymentUrlFrom(payload);
  if (!paymentUrl || !/^https?:\/\//i.test(paymentUrl)) throw new Error("CamerPay did not return a payment link");
  return { payload, paymentUrl, providerReference: providerRefFrom(payload) || null };
}

async function sendActivationEmail(config: SubscriptionConfig, params: { email: string; name: string; orderReference: string; rawToken: string }) {
  if (!config.mailtrapApiToken) throw new Error("Mailtrap API token is not configured");

  const text = `Bonjour ${params.name},\n\nVotre paiement wFileManager Pro est confirmé.\n\nToken d'activation Pro : ${params.rawToken}\n\nEntrez ce token sur la page /setup pendant l'installation Pro.\n\nRéférence de commande : ${params.orderReference}\n\nCe token est valable pour une seule installation. Si vous avez une question, contactez ${config.supportEmail}.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2>wFileManager Pro activation</h2>
      <p>Bonjour ${params.name},</p>
      <p>Votre paiement wFileManager Pro est confirmé.</p>
      <p><strong>Token d'activation Pro</strong></p>
      <pre style="padding:12px;background:#f3f4f6;border-radius:8px;font-size:16px">${params.rawToken}</pre>
      <p>Entrez ce token sur la page <strong>/setup</strong> pendant l'installation Pro.</p>
      <p>Référence de commande : <strong>${params.orderReference}</strong></p>
      <p>Ce token est valable pour une seule installation.</p>
      <p>Support : <a href="mailto:${config.supportEmail}">${config.supportEmail}</a></p>
    </div>`;

  const response = await fetch(config.mailtrapApiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.mailtrapApiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: { email: config.mailtrapFromEmail, name: config.mailtrapFromName },
      to: [{ email: params.email, name: params.name }],
      subject: "Your wFileManager Pro activation token",
      text,
      html,
      category: "wfilemanager-pro-activation",
    }),
  });
  const result = await response.text();
  if (!response.ok) throw new Error(`Mailtrap failed (${response.status}): ${result.slice(0, 300)}`);
}

async function checkout(config: SubscriptionConfig, body: Record<string, unknown>) {
  const buyerName = clean(body.buyerName || body.name);
  const buyerEmail = clean(body.buyerEmail || body.email).toLowerCase();
  const buyerPhone = normalizeCameroonPhone(clean(body.buyerPhone || body.phone));
  const buyerCompany = clean(body.buyerCompany || body.company) || null;
  const buyerCountry = clean(body.buyerCountry || body.country);
  const billingAddress = clean(body.billingAddress || body.address);
  const billingCity = clean(body.billingCity || body.city) || null;
  const billingPostalCode = clean(body.billingPostalCode || body.postalCode) || null;

  if (buyerName.length < 2) return json({ error: "Buyer name is required" }, 400);
  if (!emailValid(buyerEmail)) return json({ error: "A valid billing email is required" }, 400);
  if (buyerPhone.length < 9) return json({ error: "Buyer phone is required" }, 400);
  if (buyerCountry.length < 2) return json({ error: "Buyer country is required" }, 400);
  if (billingAddress.length < 4) return json({ error: "Billing address is required" }, 400);

  const reference = orderReference();

  const { data: order, error } = await supabase.from("wfilemanager_pro_orders").insert({
    order_reference: reference,
    status: "pending",
    buyer_name: buyerName,
    buyer_email: buyerEmail,
    buyer_phone: buyerPhone,
    buyer_company: buyerCompany,
    buyer_country: buyerCountry,
    billing_address: billingAddress,
    billing_city: billingCity,
    billing_postal_code: billingPostalCode,
    amount_usd: config.priceUsd,
    amount_xaf: config.priceXaf,
    currency: config.currency,
    period_days: config.periodDays,
    storage_quota_bytes: config.storageQuotaBytes,
  }).select("*").single();
  if (error) throw error;

  try {
    const payment = await createCamerPayLink(config, order);
    const { error: updateError } = await supabase.from("wfilemanager_pro_orders").update({
      status: "payment_pending",
      provider_reference: payment.providerReference,
      provider_payment_url: payment.paymentUrl,
      provider_payload: payment.payload,
    }).eq("id", order.id);
    if (updateError) throw updateError;
    return json({
      orderReference: reference,
      paymentUrl: payment.paymentUrl,
      amountUsd: config.priceUsd,
      amountXaf: config.priceXaf,
      currency: config.currency,
      status: "payment_pending",
    });
  } catch (error) {
    await supabase.from("wfilemanager_pro_orders").update({
      status: "failed",
      provider_payload: { error: error instanceof Error ? error.message : "Payment link generation failed" },
    }).eq("id", order.id);
    throw error;
  }
}

async function issueTokenAndEmail(config: SubscriptionConfig, order: Record<string, unknown>) {
  if (order.activation_token_id && order.token_email_sent_at) return;
  if (order.activation_token_id && !order.token_email_sent_at) {
    await supabase.from("wfilemanager_pro_activation_tokens").update({ status: "revoked", updated_at: new Date().toISOString() }).eq("id", order.activation_token_id);
  }

  const rawToken = `WFM-PRO-${randomHex(3)}-${randomHex(3)}-${randomHex(3)}-${randomHex(3)}`;
  const tokenHash = await sha256(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: token, error: tokenError } = await supabase.from("wfilemanager_pro_activation_tokens").insert({
    token_hash: tokenHash,
    status: "available",
    period_days: order.period_days,
    storage_quota_bytes: order.storage_quota_bytes,
    customer_email: order.buyer_email,
    order_reference: order.order_reference,
    expires_at: expiresAt,
  }).select("id").single();
  if (tokenError) throw tokenError;

  await supabase.from("wfilemanager_pro_orders").update({
    activation_token_id: token.id,
    status: "paid",
    paid_at: order.paid_at || new Date().toISOString(),
    token_email_error: null,
  }).eq("id", order.id);

  try {
    await sendActivationEmail(config, {
      email: String(order.buyer_email),
      name: String(order.buyer_name),
      orderReference: String(order.order_reference),
      rawToken,
    });
    await supabase.from("wfilemanager_pro_orders").update({
      status: "activation_sent",
      token_email_sent_at: new Date().toISOString(),
      token_email_error: null,
    }).eq("id", order.id);
  } catch (error) {
    await supabase.from("wfilemanager_pro_orders").update({
      status: "email_failed",
      token_email_error: error instanceof Error ? error.message : "Email failed",
    }).eq("id", order.id);
    throw error;
  }
}

async function webhook(config: SubscriptionConfig, request: Request, rawBody: string) {
  if (!await verifyWebhookSignature(config, request, rawBody)) return json({ error: "Invalid signature" }, 401);
  const payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
  const reference = invoiceFromWebhook(payload);
  if (!reference) return json({ error: "Missing merchant invoice reference" }, 400);

  const { data: order, error } = await supabase.from("wfilemanager_pro_orders").select("*").eq("order_reference", reference).maybeSingle();
  if (error) throw error;
  if (!order) return json({ error: "Order not found" }, 404);

  const paymentStatus = statusFromWebhook(payload);
  const paidAmount = amountFromWebhook(payload);
  const amountOk = paidAmount === null || paidAmount >= Number(order.amount_xaf || 0);
  const paid = isPaidStatus(paymentStatus) && amountOk;

  await supabase.from("wfilemanager_pro_orders").update({
    webhook_payload: payload,
    provider_reference: providerRefFrom(payload) || order.provider_reference,
    status: paid ? "paid" : order.status,
    paid_at: paid ? new Date().toISOString() : order.paid_at,
  }).eq("id", order.id);

  if (paid) {
    const { data: freshOrder, error: reloadError } = await supabase.from("wfilemanager_pro_orders").select("*").eq("id", order.id).single();
    if (reloadError) throw reloadError;
    await issueTokenAndEmail(config, freshOrder);
  }

  return json({ success: true, orderReference: reference, paid });
}

async function orderStatus(url: URL) {
  const reference = clean(url.searchParams.get("orderReference") || url.searchParams.get("order"));
  const email = clean(url.searchParams.get("email")).toLowerCase();
  if (!reference || !emailValid(email)) return json({ error: "Order reference and billing email are required" }, 400);
  const { data: order, error } = await supabase
    .from("wfilemanager_pro_orders")
    .select("order_reference,status,buyer_email,amount_usd,amount_xaf,currency,provider_payment_url,paid_at,token_email_sent_at,token_email_error,created_at")
    .eq("order_reference", reference)
    .maybeSingle();
  if (error) throw error;
  if (!order || String(order.buyer_email).toLowerCase() !== email) return json({ error: "Order not found" }, 404);
  return json({
    orderReference: order.order_reference,
    status: order.status,
    amountUsd: order.amount_usd,
    amountXaf: order.amount_xaf,
    currency: order.currency,
    paymentUrl: order.provider_payment_url,
    paidAt: order.paid_at,
    activationEmailSentAt: order.token_email_sent_at,
    emailError: order.token_email_error ? true : false,
    createdAt: order.created_at,
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  try {
    const url = new URL(request.url);
    const action = url.pathname.split("/").filter(Boolean).pop() || "status";
    const config = await loadConfig();

    if (action === "checkout") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      return await checkout(config, body);
    }
    if (action === "webhook") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      const rawBody = await request.text();
      return await webhook(config, request, rawBody);
    }
    if (action === "order") {
      if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
      return await orderStatus(url);
    }
    if (action === "status") return json({ ok: true });

    return json({ error: "Not found" }, 404);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Subscription API failed" }, 500);
  }
});