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
          "Choose Community for free SQLite storage on your server, or buy a wFileManager Pro licence key for managed application data.",
      },
    ],
  }),
  component: PricingPage,
});

const SUPPORT_EMAIL = "support@kmerhosting.com";

function PricingPage() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden border-b border-border bg-background text-foreground">
        <div className="absolute inset-0 grid-bg" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Choose your wFileManager edition
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              Both editions include the same file-manager features. The difference is where wFileManager stores its own application records and who is responsible for backup, recovery and licence billing.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            <article className="card-surface relative flex flex-col overflow-hidden p-8 pt-10">
              <Ribbon>SQLite on your server</Ribbon>
              <h2 className="pr-24 text-xl font-semibold">Community</h2>
              <div className="mt-7 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tight">$0</span>
                <span className="pb-1 text-sm text-muted-foreground">USD</span>
              </div>
              <p className="mt-2 text-sm font-medium brand-text">Free forever · No licence key required</p>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Community stores wFileManager users, roles, sessions, authentication records, notifications and settings locally in SQLite on your server.
              </p>
              <ul className="mt-7 space-y-3 pb-8 text-sm text-muted-foreground">
                <Feature>All wFileManager features</Feature>
                <Feature>SQLite stored at /var/lib/wfilemanager/wfilemanager.db</Feature>
                <Feature>Application records remain on your server</Feature>
                <Feature>You manage backups, restores, migrations and maintenance</Feature>
                <Feature>Uninstall removes local SQLite data and configuration</Feature>
                <Feature>Community support</Feature>
              </ul>
              <a href="/#install" className="btn-ghost btn-ghost-hover mt-auto inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold">
                Install Community
              </a>
            </article>

            <article className="card-surface relative flex flex-col overflow-hidden p-8 pt-10">
              <Ribbon accent>Paid licence key</Ribbon>
              <h2 className="pr-20 text-xl font-semibold">Pro</h2>
              <div className="mt-7 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tight">$50</span>
                <span className="pb-1 text-sm text-muted-foreground">USD / year</span>
              </div>
              <p className="mt-2 text-sm font-medium brand-text">Per instance · 100 MB included</p>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Pro stores wFileManager application records in managed infrastructure with backups, recovery metadata and support for server reinstall or replacement. A paid licence key is required before first setup.
              </p>
              <ul className="mt-7 space-y-3 pb-8 text-sm text-muted-foreground">
                <Feature>All wFileManager features</Feature>
                <Feature>Managed users, roles, sessions and authentication records</Feature>
                <Feature>Automatic backups of wFileManager application data</Feature>
                <Feature>Recovery Kit reconnects a replacement installation</Feature>
                <Feature>100 MB included, then $1 USD/year per additional 100 MB</Feature>
                <Feature>Customer account balance stored and displayed in USD</Feature>
                <Feature>Recharge the account through CamerPay</Feature>
                <Feature>Buy or renew using balance or direct payment</Feature>
                <Feature>Automatic renewal attempts from balance about 7 days before expiry</Feature>
                <Feature>English email reminders and payment confirmations</Feature>
                <Feature>Licence key displayed in the dashboard and sent once by email</Feature>
                <Feature>Unpaid +7 days: account suspended</Feature>
                <Feature>Unpaid +30 days: managed data and account deleted</Feature>
                <Feature>Priority technical support</Feature>
              </ul>
              <a href="/account" className="btn-brand btn-brand-hover mt-auto inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold">
                Buy a licence key
              </a>
            </article>
          </div>

          <div className="mx-auto mt-8 grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-[var(--surface-1)] p-6">
              <h2 className="text-sm font-semibold text-foreground">What Pro stores</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Pro covers records used by wFileManager itself: application users, roles, sessions, authentication records, notifications, settings, backup metadata and recovery metadata.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-[var(--surface-1)] p-6">
              <h2 className="text-sm font-semibold text-foreground">What neither edition stores</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                wFileManager does not store or back up your server filesystem files, websites, databases, uploads or directories. Those remain on your server and require a separate backup policy.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-4xl rounded-lg border border-border bg-[var(--surface-1)] p-5 text-center text-sm text-muted-foreground">
            Pro costs $50 USD per instance per year and includes 100 MB of managed application storage. The customer account supports a USD balance, account top-ups, balance or direct payment, payment-status checks and automatic renewal from available balance. Read the{" "}
            <a href="/terms" className="font-medium brand-text hover:underline">Terms of Use</a>
            {" "}or contact{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium brand-text hover:underline">{SUPPORT_EMAIL}</a>
            {" "}for technical support.
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

function Ribbon({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <div className={`absolute -right-12 top-7 w-44 rotate-45 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.16em] shadow-sm ${accent ? "bg-[var(--brand)] text-[var(--primary-foreground)]" : "border-y border-border bg-[var(--surface-2)] text-muted-foreground"}`}>
      {children}
    </div>
  );
}

function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0 brand-text" aria-hidden>
        <path d="M5 12l5 5L20 7" />
      </svg>
      <span>{children}</span>
    </li>
  );
}
