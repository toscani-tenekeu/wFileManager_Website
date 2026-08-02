import { describe, expect, test } from "bun:test";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");

async function source(relativePath: string) {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("open source website", () => {
  test("does not expose pricing, account or customer API routes", async () => {
    const routeTree = await source("src/routeTree.gen.ts");

    expect(routeTree).not.toContain("/pricing");
    expect(routeTree).not.toContain("/account");
    expect(routeTree).not.toContain("/api/customer");
    await expect(access(path.join(root, "src/routes/pricing.tsx"))).rejects.toThrow();
    await expect(access(path.join(root, "src/routes/account.tsx"))).rejects.toThrow();
    await expect(access(path.join(root, "src/routes/api.customer.ts"))).rejects.toThrow();
  });

  test("presents one open source product with the blue primary color", async () => {
    const content = await Promise.all([
      source("src/routes/index.tsx"),
      source("src/routes/about.tsx"),
      source("src/routes/docs.tsx"),
      source("src/routes/terms.tsx"),
      source("src/components/MarketingLayout.tsx"),
    ]).then((files) => files.join("\n"));
    const styles = await source("src/styles.css");

    expect(content).not.toMatch(/Community|Pro plan|Plan Pro|SQLite on your server|heartbeat/i);
    expect(styles.match(/#1A73E8/g)?.length).toBeGreaterThanOrEqual(6);
  });

  test("renders one native operator console without injected commands", async () => {
    const home = await source("src/routes/index.tsx");
    const rootRoute = await source("src/routes/__root.tsx");

    expect(home.match(/label: "Uninstall wFileManager"/g)).toHaveLength(1);
    expect(rootRoute).not.toContain("HomeAdminCommandEnhancer");
    expect(rootRoute).not.toContain("createPortal");
  });
});
