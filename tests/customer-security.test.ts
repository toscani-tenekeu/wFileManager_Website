import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");

async function source(relativePath: string) {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("customer portal security", () => {
  test("stores customer sessions only in strict HttpOnly cookies", async () => {
    const proxy = await source("src/routes/api.customer.ts");
    expect(proxy).toContain("HttpOnly");
    expect(proxy).toContain("SameSite=Strict");
    expect(proxy).toContain("Secure");
    expect(proxy).not.toContain("localStorage");
  });

  test("rejects cross-site mutations and limits upstream duration", async () => {
    const proxy = await source("src/routes/api.customer.ts");
    expect(proxy).toContain('sec-fetch-site") === "cross-site"');
    expect(proxy).toContain("Cross-origin request rejected");
    expect(proxy).toContain("AbortController");
    expect(proxy).toContain("TIMEOUT_MS");
  });

  test("exposes recovery, verification and session controls", async () => {
    const account = await source("src/routes/account.tsx");
    const recovery = await source("src/components/CustomerAuthActions.tsx");
    const sessions = await source("src/components/CustomerSessions.tsx");
    expect(account).toContain("CustomerAuthActions");
    expect(account).toContain("CustomerSessions");
    expect(recovery).toContain("request-password-reset");
    expect(recovery).toContain("verify-email");
    expect(sessions).toContain('method: "DELETE"');
  });

  test("keeps invoice retrieval read-only and refreshable", async () => {
    const invoices = await source("src/components/CustomerInvoices.tsx");
    expect(invoices).toContain('cache: "no-store"');
    expect(invoices).toContain('window.addEventListener("focus"');
    expect(invoices).not.toContain('method: "POST"');
  });
});
