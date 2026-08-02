import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { MarketingLayout } from "../components/MarketingLayout";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Free Community edition - wFileManager" },
      {
        name: "description",
        content: "wFileManager is free, MIT-licensed software with local SQLite application data.",
      },
    ],
  }),
  component: PricingPage,
});

const FEATURES = [
  "Complete browser-based server file management",
  "Local users, roles, sessions and notifications",
  "SQLite data stored on your server",
  "Verified updates with automatic rollback",
  "No licence key, payment or subscription",
  "MIT licensed source code",
];

function PricingPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border bg-background text-foreground">
        <div className="mx-auto max-w-4xl px-4 py-20 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              wFileManager Community
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              One complete edition. Free to install and operate on your own Linux server.
            </p>
          </div>

          <article className="card-surface mx-auto mt-12 max-w-2xl p-8">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
              <div>
                <h2 className="text-xl font-semibold">Community</h2>
                <p className="mt-1 text-sm text-muted-foreground">SQLite on your server</p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-semibold">$0</span>
                <p className="text-xs text-muted-foreground">No recurring fee</p>
              </div>
            </div>
            <ul className="grid gap-3 py-7 text-sm text-muted-foreground sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 brand-text" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <a
              href="/#install"
              className="btn-brand btn-brand-hover inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold"
            >
              Install wFileManager
            </a>
          </article>

          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
            The server administrator is responsible for the SQLite database, backups, restores,
            migrations and local disk availability.
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
