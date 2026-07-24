import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { MarketingLayout } from "../components/MarketingLayout";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — wFileManager" },
      {
        name: "description",
        content:
          "Use wFileManager free of charge or request a professional installation service for a one-time fee of $20 USD per server.",
      },
    ],
  }),
  component: PricingPage,
});

const SUPPORT_EMAIL = "support.wfilemanager@kmerhosting.com";

function PricingPage() {
  return (
    <MarketingLayout>
      <main className="min-h-screen bg-background text-foreground">
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 grid-bg" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-32">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider brand-text">
                <span className="h-1 w-1 rounded-full bg-[var(--brand)]" />
                Pricing
              </div>
              <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
                Choose self-service or professional installation
              </h1>
              <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                wFileManager is free to use. Operators who prefer a professionally prepared deployment can request a one-time installation service for a single server.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
              <article className="card-surface flex flex-col p-8">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">Community</h2>
                  <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Self-service
                  </span>
                </div>

                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-tight">$0</span>
                  <span className="pb-1 text-sm text-muted-foreground">USD</span>
                </div>
                <p className="mt-2 text-sm font-medium brand-text">Free forever</p>

                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  Full access to wFileManager for administrators who are comfortable installing, configuring and maintaining the application independently.
                </p>

                <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
                  <Feature>All wFileManager features</Feature>
                  <Feature>Community support</Feature>
                  <Feature>Self-managed installation and configuration</Feature>
                  <Feature>Self-managed updates and server maintenance</Feature>
                  <Feature>No subscription or usage fees</Feature>
                </ul>

                <a
                  href="/#install"
                  className="btn-ghost btn-ghost-hover mt-auto inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold"
                >
                  Install Community
                </a>
              </article>

              <article className="card-surface flex flex-col p-8">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">Professional Installation</h2>
                  <span className="rounded-full border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider brand-text">
                    Assisted
                  </span>
                </div>

                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-tight">$20</span>
                  <span className="pb-1 text-sm text-muted-foreground">USD</span>
                </div>
                <p className="mt-2 text-sm font-medium brand-text">
                  One-time fee per server installation
                </p>

                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  A clean installation and initial configuration of wFileManager on one compatible server, completed with professional assistance from the support team.
                </p>

                <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
                  <Feature>Clean installation on one compatible server</Feature>
                  <Feature>Initial application configuration</Feature>
                  <Feature>Basic post-installation verification</Feature>
                  <Feature>Priority support during the installation process</Feature>
                  <Feature>30-day money-back guarantee</Feature>
                  <Feature>No recurring subscription</Feature>
                </ul>

                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=wFileManager%20professional%20installation`}
                  className="btn-brand btn-brand-hover mt-auto inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold"
                >
                  Request installation
                </a>
              </article>
            </div>

            <div className="mx-auto mt-8 grid max-w-4xl gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-[var(--surface-1)] p-6">
                <h2 className="text-sm font-semibold text-foreground">30-day satisfaction guarantee</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  The professional installation fee is refundable when a refund request is submitted within 30 calendar days of the completed installation and the customer is not satisfied with the service.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-[var(--surface-1)] p-6">
                <h2 className="text-sm font-semibold text-foreground">Service scope</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  The service covers installation and initial configuration only. Ongoing data management, file administration, backups, migrations, content recovery and routine server operation are not included after installation.
                </p>
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-4xl rounded-lg border border-border bg-[var(--surface-1)] p-5 text-center text-sm text-muted-foreground">
              To request the professional installation service, contact{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium brand-text hover:underline">
                {SUPPORT_EMAIL}
              </a>
              . The $20 USD fee applies to each server installation requested.
            </div>
          </div>
        </section>
      </main>
    </MarketingLayout>
  );
}

function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 h-4 w-4 shrink-0 brand-text"
        aria-hidden
      >
        <path d="M5 12l5 5L20 7" />
      </svg>
      <span>{children}</span>
    </li>
  );
}
