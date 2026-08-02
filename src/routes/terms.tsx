import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "../components/MarketingLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use - wFileManager" },
      { name: "description", content: "Terms for the open source wFileManager software." },
    ],
  }),
  component: TermsPage,
});

const SUPPORT_EMAIL = "support@kmerhosting.com";

function TermsPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border bg-background text-foreground">
        <div className="mx-auto max-w-4xl px-4 py-20 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] brand-text">Legal</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Terms of Use</h1>
          <p className="mt-4 text-xs text-muted-foreground">Last updated: 2026-08-02</p>

          <div className="mt-10 space-y-6">
            <TermSection title="1. Open source software">
              <p>wFileManager is free, open source software distributed under the MIT License.</p>
            </TermSection>
            <TermSection title="2. Operator responsibility">
              <p>
                The server administrator is responsible for access control, filesystem operations,
                backups, restores, local disk capacity and compliance with applicable laws and
                third-party licences.
              </p>
              <p>
                wFileManager can operate with elevated privileges. Incorrect paths or commands can
                cause permanent data loss, service interruption or server compromise.
              </p>
            </TermSection>
            <TermSection title="3. Uninstalling">
              <p>
                Uninstalling removes the application, its records and its configuration. The
                uninstaller can keep system packages that were installed as prerequisites.
              </p>
            </TermSection>
            <TermSection title="4. Availability and support">
              <p>
                The software is provided under the MIT License without warranty. Technical and
                security reports may be sent to{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium brand-text hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </TermSection>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

function TermSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-[var(--surface-1)] p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
