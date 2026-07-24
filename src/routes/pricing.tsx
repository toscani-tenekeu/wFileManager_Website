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
          "Choose the free Community edition or request Pro installation assistance and priority support for wFileManager.",
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
                Simple, lifetime pricing
              </h1>
              <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                Use every wFileManager feature at no cost, or choose professional installation assistance and priority support for a one-time fee.
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
                  The complete wFileManager experience for administrators who prefer to install and operate the application independently.
                </p>
                <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
                  <Feature>All wFileManager features</Feature>
                  <Feature>Community support</Feature>
                  <Feature>Self-service installation and maintenance</Feature>
                  <Feature>No subscription or usage fee</Feature>
                </ul>
                <a
                  href="/#install"
                  className="btn-ghost btn-ghost-hover mt-8 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold"
                >
                  Install Community
                </a>
              </article>

              <article className="card-surface flex flex-col p-8">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">Pro</h2>
                  <span className="rounded-full border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider brand-text">
                    Assisted
                  </span>
                </div>
                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-tight">$20</span>
                  <span className="pb-1 text-sm text-muted-foreground">USD</span>
                </div>
                <p className="mt-2 text-sm font-medium brand-text">
                  One-time fee per successful installation, per server
                </p>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  Professional assistance for operators who want wFileManager installed correctly, with faster access to support when help is required.
                </p>
                <ul className="mt-7 space-y-3 text-sm text-muted-foreground">
                  <Feature>All wFileManager features</Feature>
                  <Feature>Priority support</Feature>
                  <Feature>Installation and initial configuration assistance</Feature>
                  <Feature>No recurring subscription</Feature>
                </ul>
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=wFileManager%20Pro%20installation`}
                  className="btn-brand btn-brand-hover mt-8 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold"
                >
                  Contact support
                </a>
              </article>
            </div>

            <div className="mx-auto mt-8 max-w-4xl rounded-lg border border-border bg-[var(--surface-1)] p-5 text-center text-sm text-muted-foreground">
              Pro assistance must be requested through{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium brand-text hover:underline">
                {SUPPORT_EMAIL}
              </a>
              . The fee applies only after a successful installation on the requested server.
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
