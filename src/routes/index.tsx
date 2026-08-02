import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

const GITHUB = "https://github.com/toscani-tenekeu/wFileManager";
const DOCS = "/docs";
const INSTALL_CMD =
  "curl -fsSL https://igihzeyfgwhnuiflamvn.supabase.co/storage/v1/object/public/releases.kmerhosting.com/wfilemanager/install.sh | sudo bash";
const UNINSTALL_CMD =
  "curl -fsSL https://igihzeyfgwhnuiflamvn.supabase.co/storage/v1/object/public/releases.kmerhosting.com/wfilemanager/uninstall.sh | sudo bash";

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <LogosStrip />
      <Features />
      <Screenshots />
      <Security />
      <Terminal />
      <Install />
      <AdminCommands />
      <Recovery />
      <CTA />
      <Footer />
    </div>
  );
}

/* ---------------- NAV ---------------- */
function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <a href="#" className="flex items-center">
          <span className="text-sm font-semibold tracking-tight">wFileManager</span>
        </a>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#install" className="hover:text-foreground">
            Install
          </a>
          <a href={DOCS} className="hover:text-foreground">
            Docs
          </a>
          <a href="/about" className="hover:text-foreground">
            About
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost btn-ghost-hover inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
          >
            <GithubIcon className="h-3.5 w-3.5" /> GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

/* ---------------- HERO ---------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 grid-bg" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            The open source file manager
            <br />
            <span className="brand-text">for Linux servers.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            wFileManager gives your Linux server a modern web file explorer, guarded archives,
            per‑user trash, application accounts with roles, notifications, verified updates and an
            administrator‑only root PTY terminal — all over HTTPS.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#install"
              className="btn-brand btn-brand-hover inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"
            >
              Install on your server
              <span aria-hidden>→</span>
            </a>
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost btn-ghost-hover inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
            >
              <GithubIcon className="h-4 w-4" /> Star on GitHub
            </a>
          </div>

          <div className="mx-auto mt-10 max-w-2xl">
            <TerminalBlock cmd={INSTALL_CMD} />
          </div>
        </div>

        <AppPreview />
      </div>
    </section>
  );
}

function AppPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="card-surface overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-[var(--surface-2)] px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6_0.2_27)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.75_0.15_80)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.75_0.17_158)]" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md bg-background/60 px-3 py-1 text-xs text-muted-foreground">
            <LockIcon className="h-3 w-3 brand-text" />
            files.your-server.example
          </div>
          <div className="w-16" />
        </div>
        <div className="grid grid-cols-12 gap-0">
          <aside className="col-span-3 border-r border-border bg-[var(--surface-1)] p-3 text-xs">
            <div className="mb-2 px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              Filesystem
            </div>
            {["/", "etc", "home", "opt", "var", "root", "usr"].map((n, i) => (
              <div
                key={n}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${i === 3 ? "bg-[var(--surface-2)] text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <FolderIcon className="h-3.5 w-3.5 brand-text" />
                {n}
              </div>
            ))}
            <div className="mt-4 border-t border-border pt-3">
              <div className="mb-2 px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                System
              </div>
              {[
                ["Trash", TrashIcon],
                ["Users", UsersIcon],
                ["Sessions", KeyIcon],
                ["Terminal", TerminalIcon],
              ].map(([label, Ico]) => {
                const I = Ico as (p: { className?: string }) => React.ReactElement;
                return (
                  <div
                    key={label as string}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <I className="h-3.5 w-3.5" />
                    {label as string}
                  </div>
                );
              })}
            </div>
          </aside>
          <div className="col-span-9 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-foreground">/opt</span> / wfilemanager
              </div>
              <div className="flex gap-2">
                {["Upload", "New", "Archive"].map((b) => (
                  <span
                    key={b}
                    className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-2)] text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Size</th>
                    <th className="px-3 py-2 font-medium">Owner</th>
                    <th className="px-3 py-2 font-medium">Modified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["releases", "—", "root", "2 min ago", FolderIcon],
                    ["current", "—", "root", "2 min ago", FolderIcon],
                    ["config.env", "1.2 KB", "root", "1 h ago", FileIcon],
                    ["backup-2026-07.tar.gz", "482 MB", "root", "Yesterday", ArchiveIcon],
                    ["install.sh", "18 KB", "root", "3 days", FileIcon],
                    ["wfilemanager.db", "6.4 MB", "wfm", "Now", DbIcon],
                  ].map(([name, size, owner, mod, Ico]) => {
                    const I = Ico as (p: { className?: string }) => React.ReactElement;
                    return (
                      <tr key={name as string} className="hover:bg-[var(--surface-1)]">
                        <td className="flex items-center gap-2 px-3 py-2">
                          <I className="h-3.5 w-3.5 brand-text" />
                          {name as string}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{size as string}</td>
                        <td className="px-3 py-2 text-muted-foreground">{owner as string}</td>
                        <td className="px-3 py-2 text-muted-foreground">{mod as string}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- LOGOS / STATS ---------------- */
function LogosStrip() {
  const stats = [
    ["MIT", "License"],
    ["100%", "Open source"],
    ["Node 24 · Bun", "Runtime"],
    ["amd64 · arm64", "Architectures"],
    ["HTTPS only", "Public access"],
  ];
  return (
    <section className="border-b border-border bg-[var(--surface-1)]/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-5">
        {stats.map(([v, l]) => (
          <div key={l} className="text-center">
            <div className="text-lg font-semibold tracking-tight text-foreground">{v}</div>
            <div className="mt-1 text-xs text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- FEATURES ---------------- */
function Features() {
  const items = [
    {
      icon: FolderIcon,
      title: "Real filesystem browsing",
      desc: "Explore from `/` with multi‑select, copy, move, rename and delete on the actual Linux filesystem.",
    },
    {
      icon: UploadIcon,
      title: "Uploads & downloads",
      desc: "Streaming transfers with progress. Uploads never silently replace an existing destination.",
    },
    {
      icon: FileIcon,
      title: "Text preview & editing",
      desc: "Read and edit configuration files, scripts and logs directly from the browser.",
    },
    {
      icon: ArchiveIcon,
      title: "Guarded archives",
      desc: "Create and extract ZIP / TAR.GZ with checks on entry count, expanded size, ratio and free space.",
    },
    {
      icon: TrashIcon,
      title: "Per‑user trash",
      desc: "Soft‑delete with restore or permanent removal. Each application user has its own trash.",
    },
    {
      icon: UsersIcon,
      title: "Users, roles & permissions",
      desc: "Application accounts are isolated from the OS — no Linux user, no sudo, ever.",
    },
    {
      icon: BellIcon,
      title: "Sessions, notifications, presence",
      desc: "Live session control with notifications and presence under administrator control.",
    },
    {
      icon: RefreshIcon,
      title: "Verified updates & rollback",
      desc: "Checksum‑verified releases, health checks, atomic switch, automatic rollback on failure.",
    },
    {
      icon: TerminalIcon,
      title: "Admin‑only root PTY",
      desc: "Full root terminal for administrators, gated by current‑password verification.",
    },
  ];
  return (
    <section id="features" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <SectionHeader
          kicker="Features"
          title="Manage your server files from one secure interface"
          desc="Browse, edit, transfer, archive and administer files directly from the browser."
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {items.map(({ icon: Ico, title, desc }) => (
            <div
              key={title}
              className="group relative bg-[var(--surface-1)] p-6 transition-colors hover:bg-[var(--surface-2)]"
            >
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background">
                <Ico className="h-4 w-4 brand-text" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- SECURITY ---------------- */
function Security() {
  const rows = [
    ["Port 1973 bound to 127.0.0.1", "Public access is HTTPS‑only through Nginx."],
    ["Symbolic‑link mutations rejected", "Writes cannot escape the intended path via symlinks."],
    [
      "Blocked writes to /proc, /sys, /dev, /run",
      "System‑critical trees are protected by default.",
    ],
    ["Uploads never replace destinations", "Existing files are preserved unless explicitly moved."],
    [
      "Guarded archive extraction",
      "Entry count, expanded size, ratio and free space are all checked.",
    ],
    ["Verified releases", "Size and SHA‑256 are validated before atomic activation."],
    [
      "Private application state",
      "Accounts and settings are never sent to a hosted wFileManager backend.",
    ],
    ["0600 permissions on secrets", "Local administrator recovery material is locked to root."],
  ];
  return (
    <section id="security" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <SectionHeader
          kicker="Security"
          title="Elevated privileges, hardened by default"
          desc="wFileManager runs with real filesystem access. Every dangerous path is a decision, not an accident."
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
          {rows.map(([t, d]) => (
            <div key={t} className="flex gap-4 bg-[var(--surface-1)] p-6">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                <ShieldIcon className="h-4 w-4 brand-text" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">{t}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- TERMINAL ---------------- */
function Terminal() {
  return (
    <section className="border-b border-border bg-[var(--surface-1)]/30">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 md:grid-cols-2 md:items-center">
        <div>
          <SectionHeader
            align="left"
            kicker="Root terminal"
            title="A real PTY, gated behind the admin password"
            desc="Administrators get a full root shell in the browser — but every session requires current‑password verification, and terminal endpoints are locked to admins only."
          />
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            <Bullet>Interactive PTY, not a fake command runner</Bullet>
            <Bullet>Current‑password re‑verification before opening</Bullet>
            <Bullet>Sessions revoked on password change or recovery</Bullet>
          </ul>
        </div>
        <div className="card-surface overflow-hidden font-mono text-[13px]">
          <div className="flex items-center gap-2 border-b border-border bg-[var(--surface-2)] px-3 py-2 text-xs text-muted-foreground">
            <TerminalIcon className="h-3.5 w-3.5 brand-text" />
            root@server: ~
          </div>
          <div className="space-y-1 p-4">
            <Line prompt>systemctl status wfilemanager.service --no-pager</Line>
            <Line dim>● wfilemanager.service — wFileManager</Line>
            <Line dim>
              {" "}
              Active: <span className="brand-text">active (running)</span> since Fri
            </Line>
            <Line dim> Docs: https://github.com/toscani-tenekeu/wFileManager</Line>
            <Line prompt>curl -fsS http://127.0.0.1:1973/api/health</Line>
            <Line dim>{`{ "status": "ok", "release": "current" }`}</Line>
            <Line prompt>journalctl -u wfilemanager.service -f</Line>
            <Line dim>info health check passed · local database ready</Line>
            <Line dim>info session opened · admin · 10.0.0.4</Line>
            <Line prompt>
              <span className="inline-block h-3.5 w-2 translate-y-0.5 animate-pulse bg-[var(--brand)]" />
            </Line>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- INSTALL ---------------- */
function Install() {
  return (
    <section id="install" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <SectionHeader
          kicker="Install"
          title="One command on a supported Ubuntu server"
          desc="Point your domain's A record to the public IPv4 address of the server where wFileManager will be installed, then wait until the domain resolves to that address before running the installer."
        />
        <div className="mx-auto mt-10 max-w-3xl">
          <TerminalBlock cmd={INSTALL_CMD} />
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="card-surface p-6">
            <h4 className="text-sm font-semibold">Requirements</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <Bullet>Ubuntu 20.04 LTS or newer (24.04 LTS recommended)</Bullet>
              <Bullet>KVM, bare metal, or LXC with systemd and root</Bullet>
              <Bullet>amd64 or arm64</Bullet>
              <Bullet>Domain with an A record pointing to the server public IPv4 address</Bullet>
              <Bullet>Public ports 80 and 443</Bullet>
            </ul>
          </div>
          <div className="card-surface p-6">
            <h4 className="text-sm font-semibold">After install</h4>
            <p className="mt-3 text-sm text-muted-foreground">
              Open the setup page in your browser:
            </p>
            <div className="mt-3">
              <CodeBlock code="https://your-domain.example/setup" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Administrator passwords require 12+ alphanumeric characters with uppercase, lowercase
              and a number. Identical consecutive characters are rejected.
            </p>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-muted-foreground">
          Installation by IP address or plain HTTP is not supported. The installer verifies that the
          domain resolves to the server before configuring HTTPS with Certbot. A free test subdomain
          is available at{" "}
          <a
            href="https://domain.kmerhosting.com"
            target="_blank"
            rel="noreferrer"
            className="brand-text hover:underline"
          >
            domain.kmerhosting.com
          </a>
          .
        </p>
      </div>
    </section>
  );
}

/* ---------------- ADMIN ---------------- */
function AdminCommands() {
  const cmds = [
    ["Service status", "sudo systemctl status wfilemanager.service --no-pager"],
    ["Service logs", "sudo journalctl -u wfilemanager.service -f"],
    ["Application health", "curl -fsS http://127.0.0.1:1973/api/health"],
    ["Reset admin password", "sudo wfilemanager-reset-admin-password"],
    ["Update application", "sudo systemctl start wfilemanager-updater@install.service"],
    ["Roll back to previous release", "sudo systemctl start wfilemanager-updater@rollback.service"],
    ["Uninstall wFileManager", UNINSTALL_CMD],
  ];
  return (
    <section id="admin" className="border-b border-border bg-[var(--surface-1)]/30">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <SectionHeader
          kicker="Administration"
          title="Everything an operator needs, in the shell"
          desc="wFileManager ships helper commands and systemd units for status, logs, health, updates, rollback and clean removal."
        />
        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {cmds.map(([label, cmd]) => (
            <div key={label} className="card-surface p-4">
              <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                {label}
              </div>
              <CodeBlock code={cmd} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- RECOVERY ---------------- */
function Recovery() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-4xl px-4 py-24">
        <div className="mx-auto max-w-2xl">
          <SectionHeader
            kicker="Backups"
            title="Include application state in your backup policy"
            desc="Back up wFileManager state with the rest of your server and verify that it can be restored before an incident."
          />
          <div className="mt-6 space-y-3">
            <CodeBlock code="/var/lib/wfilemanager/wfilemanager.db" />
          </div>
          <div className="mt-6 rounded-lg border border-border bg-[var(--surface-1)] p-4 text-sm text-muted-foreground">
            <span className="text-foreground">Scope:</span> wFileManager application data and server
            filesystem content are separate. Your backup plan must cover both where required.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
function CTA() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="relative mx-auto max-w-4xl px-4 py-24 text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Ready to add a proper file manager to your server?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          wFileManager is free, MIT‑licensed and designed for Linux server administration. Install
          in a single command — or review the source first.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#install"
            className="btn-brand btn-brand-hover rounded-md px-5 py-2.5 text-sm font-semibold"
          >
            Get started
          </a>
          <a
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost btn-ghost-hover inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium"
          >
            <GithubIcon className="h-4 w-4" /> View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */
function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row">
        <span>
          <span className="text-foreground">wFileManager</span> · Developed by KmerHosting LLC
        </span>
        <div className="flex items-center gap-6">
          <a href={GITHUB} target="_blank" rel="noreferrer" className="hover:text-foreground">
            GitHub
          </a>
          <a
            href={`${GITHUB}/blob/main/CONTRIBUTING.md`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            Contribute
          </a>
          <a
            href={`${GITHUB}/blob/main/SECURITY.md`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            Security
          </a>
          <a
            href={`${GITHUB}/blob/main/LICENSE`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            MIT License
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- SHARED ---------------- */
function SectionHeader({
  kicker,
  title,
  desc,
  align = "center",
}: {
  kicker: string;
  title: string;
  desc?: string;
  align?: "center" | "left";
}) {
  const a = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`${a} max-w-2xl`}>
      <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider brand-text">
        <span className="h-1 w-1 rounded-full" style={{ backgroundColor: "var(--brand)" }} />
        {kicker}
      </div>
      <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {desc && <p className="mt-4 text-pretty text-muted-foreground">{desc}</p>}
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 brand-text" />
      <span>{children}</span>
    </li>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-background px-3 py-2 font-mono text-[12px] leading-relaxed text-foreground">
      <code>{code}</code>
    </pre>
  );
}

function TerminalBlock({ cmd }: { cmd: string }) {
  const [copied, setCopied] = React.useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };
  return (
    <div className="card-surface overflow-hidden text-left">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-[var(--surface-2)] px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-3.5 w-3.5 brand-text" />
          bash
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="btn-ghost btn-ghost-hover inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium"
          aria-label="Copy command"
        >
          {copied ? <CheckIcon className="h-3 w-3 brand-text" /> : <CopyIcon className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed">
        <code>
          <span className="brand-text">$ </span>
          {cmd}
        </code>
      </pre>
    </div>
  );
}

function Line({
  children,
  prompt = false,
  dim = false,
}: {
  children: React.ReactNode;
  prompt?: boolean;
  dim?: boolean;
}) {
  return (
    <div className={dim ? "text-muted-foreground" : ""}>
      {prompt && <span className="brand-text">root@server:~# </span>}
      {children}
    </div>
  );
}

/* ---------------- ICONS ---------------- */
type IP = { className?: string };
const S = (p: IP & { d: string; extra?: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={p.className}
  >
    <path d={p.d} />
    {p.extra}
  </svg>
);

/* ---------------- THEME SELECTOR ---------------- */
type ThemePreference = "system" | "light" | "dark";

function applyThemePreference(theme: ThemePreference) {
  const shouldUseDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", shouldUseDark);
}

function ThemeToggle() {
  const [theme, setTheme] = React.useState<ThemePreference>("system");

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const stored = localStorage.getItem("theme");
    const initial: ThemePreference =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system";

    setTheme(initial);
    applyThemePreference(initial);

    const onSystemThemeChange = () => {
      const active = localStorage.getItem("theme") ?? "system";
      if (active === "system") applyThemePreference("system");
    };

    media.addEventListener("change", onSystemThemeChange);
    return () => media.removeEventListener("change", onSystemThemeChange);
  }, []);

  const selectTheme = (next: ThemePreference) => {
    setTheme(next);
    applyThemePreference(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* noop */
    }
  };

  const options: Array<{
    value: ThemePreference;
    label: string;
    icon: (p: IP) => React.ReactElement;
  }> = [
    { value: "system", label: "System theme", icon: MonitorIcon },
    { value: "light", label: "Light theme", icon: SunIcon },
    { value: "dark", label: "Dark theme", icon: MoonIcon },
  ];

  return (
    <div
      role="group"
      aria-label="Theme preference"
      className="inline-flex items-center rounded-md border border-border bg-background p-0.5"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => selectTheme(value)}
          aria-label={label}
          aria-pressed={theme === value}
          title={label}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-[5px] transition-colors ${
            theme === value
              ? "bg-[var(--surface-2)] text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

/* ---------------- SCREENSHOTS ---------------- */
const SCREENSHOTS: { title: string; desc: string; ratio: string }[] = [
  {
    title: "File explorer",
    desc: "Real filesystem browsing with multi‑select, copy, move, rename and delete.",
    ratio: "aspect-[16/10]",
  },
  {
    title: "Root PTY terminal",
    desc: "Administrator‑only terminal, gated by current‑password verification.",
    ratio: "aspect-[16/10]",
  },
  {
    title: "Users, roles & sessions",
    desc: "Application accounts, permissions and live session control.",
    ratio: "aspect-[16/10]",
  },
  {
    title: "Setup wizard",
    desc: "Guided installation: domain, data mode and first administrator.",
    ratio: "aspect-[16/10]",
  },
  {
    title: "Notifications & updates",
    desc: "Verified releases, health checks and in‑app notifications.",
    ratio: "aspect-[16/10]",
  },
];

function Screenshots() {
  return (
    <section id="screenshots" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <SectionHeader
          kicker="Interfaces"
          title="See wFileManager in action"
          desc="Explore the main file-management and administration interfaces."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {SCREENSHOTS.slice(0, 1).map((s, i) => (
            <ScreenshotSlot key={s.title} index={i + 1} {...s} className="md:col-span-2" />
          ))}
          {SCREENSHOTS.slice(1).map((s, i) => (
            <ScreenshotSlot key={s.title} index={i + 2} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ScreenshotSlot({
  index,
  title,
  desc,
  ratio,
  className = "",
}: {
  index: number;
  title: string;
  desc: string;
  ratio: string;
  className?: string;
}) {
  return (
    <figure className={`card-surface overflow-hidden ${className}`}>
      <div
        className={`${ratio} relative flex items-center justify-center border-b border-dashed border-border bg-[var(--surface-2)]`}
      >
        <div className="grid-bg absolute inset-0 opacity-60" aria-hidden />
        <div className="relative text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
            <ImageIcon className="h-4 w-4 brand-text" />
          </div>
          <div className="mt-3 text-xs font-medium text-muted-foreground">
            Interface preview {index}
          </div>
          <div className="mt-1 font-mono text-[10px] text-muted-foreground/70">wFileManager</div>
        </div>
      </div>
      <figcaption className="p-5">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
      </figcaption>
    </figure>
  );
}

const CopyIcon = (p: IP) => <S {...p} d="M9 9h10v10H9zM5 15V5h10" />;
const MonitorIcon = (p: IP) => <S {...p} d="M4 5h16v12H4zM8 21h8M12 17v4" />;
const SunIcon = (p: IP) => (
  <S
    {...p}
    d="M12 4V2M12 22v-2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
    extra={<circle cx="12" cy="12" r="4" />}
  />
);
const MoonIcon = (p: IP) => <S {...p} d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />;
const ImageIcon = (p: IP) => (
  <S {...p} d="M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5" extra={<circle cx="9" cy="9" r="1.5" />} />
);
const FolderIcon = (p: IP) => (
  <S {...p} d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
);
const FileIcon = (p: IP) => (
  <S
    {...p}
    d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
    extra={<path d="M14 3v5h5" />}
  />
);
const ArchiveIcon = (p: IP) => (
  <S
    {...p}
    d="M3 7h18M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7M10 12h4"
    extra={<path d="M4 4h16v3H4z" />}
  />
);
const TrashIcon = (p: IP) => (
  <S
    {...p}
    d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"
  />
);
const UsersIcon = (p: IP) => (
  <S
    {...p}
    d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
  />
);
const BellIcon = (p: IP) => (
  <S {...p} d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0" />
);
const RefreshIcon = (p: IP) => (
  <S {...p} d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5" />
);
const TerminalIcon = (p: IP) => (
  <S
    {...p}
    d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
    extra={<path d="M7 9l3 3-3 3M13 15h4" />}
  />
);
const UploadIcon = (p: IP) => <S {...p} d="M12 3v13M6 9l6-6 6 6M4 21h16" />;
const KeyIcon = (p: IP) => (
  <S {...p} d="M15 7a4 4 0 1 1-3.6 5.7L4 20l2 2 2-2 2 2 3-3-2-2 3-3A4 4 0 0 1 15 7Z" />
);
const LockIcon = (p: IP) => <S {...p} d="M6 11h12v9H6zM8 11V8a4 4 0 1 1 8 0v3" />;
const ShieldIcon = (p: IP) => (
  <S
    {...p}
    d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3Z"
    extra={<path d="M9 12l2 2 4-4" />}
  />
);
const CloudIcon = (p: IP) => (
  <S {...p} d="M7 18a5 5 0 1 1 1.7-9.7A6 6 0 0 1 20 12a4 4 0 0 1-3 6H7Z" />
);
const DbIcon = (p: IP) => (
  <S
    {...p}
    d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3ZM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"
  />
);
const CheckIcon = (p: IP) => <S {...p} d="M5 12l5 5L20 7" />;
const GithubIcon = (p: IP) => (
  <svg viewBox="0 0 24 24" className={p.className} fill="currentColor" aria-hidden>
    <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.3.1 1.9 1.3 1.9 1.3 1.1 1.9 3 1.4 3.7 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 0 1 1.2-3.3c-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0C17 4.8 18 5 18 5c.7 1.7.2 2.9.1 3.1.8.9 1.2 2 1.2 3.3 0 4.7-2.8 5.7-5.5 6 .5.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
  </svg>
);
