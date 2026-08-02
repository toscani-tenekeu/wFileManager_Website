import { describe, expect, test } from "bun:test";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");

async function source(relativePath: string) {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("retired customer service", () => {
  test("returns Gone and clears the legacy session cookie for every method", async () => {
    const api = await source("src/routes/api.customer.ts");
    expect(api).toContain("status: 410");
    expect(api).toContain("Max-Age=0");
    expect(api).toContain("HttpOnly");
    expect(api).toContain("SameSite=Strict");
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
      expect(api).toContain(`${method}: retired`);
    }
  });

  test("redirects the old account route to the free Community offer", async () => {
    const account = await source("src/routes/account.tsx");
    expect(account).toContain('redirect({ to: "/pricing" })');
  });

  test("removes customer account components", async () => {
    for (const name of [
      "CustomerAccount.tsx",
      "CustomerAuthActions.tsx",
      "CustomerInvoices.tsx",
      "CustomerSessions.tsx",
    ]) {
      await expect(access(path.join(root, "src/components", name))).rejects.toThrow();
    }
  });

  test("publishes only the free Community edition", async () => {
    const pricing = await source("src/routes/pricing.tsx");
    expect(pricing).toContain("$0");
    expect(pricing).toContain("No licence key, payment or subscription");
    expect(pricing).not.toContain("Buy a licence");
    expect(pricing).not.toContain("$100");
  });
});
