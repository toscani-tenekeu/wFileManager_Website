import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "../components/MarketingLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — wFileManager" },
      {
        name: "description",
        content:
          "Learn how wFileManager provides secure, browser-based file management for Linux servers.",
      },
    ],
  }),
  component: AboutPage,
});

const GITHUB = "https://github.com/toscani-tenekeu/wFileManager";
const SUPPORT_EMAIL = "support@kmerhosting.com";

function AboutPage() {
  return (
    <MarketingLayout>
      <main className="min-h-screen bg-background text-foreground">
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 grid-bg" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider brand-text">
                <span className="h-1 w-1 rounded-full bg-[var(--brand)]" />
                About
              </div>
              <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
                Modern file management for Linux servers
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                wFileManager gives server administrators a modern web interface for managing the
                Linux filesystem without reducing operational control or security.
              </p>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
              <AboutCard
                title="Built for operators"
                description="Browse, upload, edit, move, archive, restore and remove files directly on the server through a focused administration interface."
              />
              <AboutCard
                title="Security by design"
                description="Privileged operations are protected by application roles, current-password verification, guarded archive handling and hardened filesystem rules."
              />
              <AboutCard
                title="Open source throughout"
                description="The complete application is MIT licensed, auditable and available from the public GitHub repository."
              />
            </div>

            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
              <section className="card-surface p-8">
                <div className="text-xs font-medium uppercase tracking-wider brand-text">
                  The project
                </div>
                <h2 className="mt-3 text-xl font-semibold">Developed by KmerHosting LLC</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  wFileManager is maintained as a practical server administration tool for Linux
                  operators who need a capable browser-based file manager, verified updates and a
                  protected root terminal.
                </p>
              </section>

              <section className="card-surface p-8">
                <div className="text-xs font-medium uppercase tracking-wider brand-text">
                  Support
                </div>
                <h2 className="mt-3 text-xl font-semibold">One official support mailbox</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Installation questions, operational issues and security reports should use{" "}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="font-medium brand-text hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </p>
              </section>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/#install"
                className="btn-brand btn-brand-hover inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold"
              >
                Install wFileManager
              </a>
              <a
                href={GITHUB}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost btn-ghost-hover inline-flex items-center rounded-md px-5 py-2.5 text-sm font-medium"
              >
                View the source
              </a>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="btn-ghost btn-ghost-hover inline-flex items-center rounded-md px-5 py-2.5 text-sm font-medium"
              >
                Contact support
              </a>
            </div>
          </div>
        </section>
      </main>
    </MarketingLayout>
  );
}

function AboutCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="bg-[var(--surface-1)] p-7 transition-colors hover:bg-[var(--surface-2)]">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </article>
  );
}
