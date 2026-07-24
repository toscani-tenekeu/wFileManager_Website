import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

const GITHUB = "https://github.com/toscani-tenekeu/wFileManager";
const DOCS = "https://kmerhosting.com/docs";
const UNINSTALL_CMD =
  "curl -fsSL https://igihzeyfgwhnuiflamvn.supabase.co/storage/v1/object/public/releases.kmerhosting.com/wfilemanager/uninstall.sh | sudo bash";

type IconProps = { className?: string };
type ThemeMode = "system" | "light" | "dark";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "wFileManager — Free & open source file manager for Linux servers" },
      { name: "description", content: "wFileManager is a modern, secure, open source web file manager for Linux servers. Browse the real filesystem, manage users, roles, sessions and an admin-only root terminal." },
      { name: "author", content: "KmerHosting LLC" },
      { property: "og:title", content: "wFileManager — Free & open source file manager for Linux servers" },
      { property: "og:description", content: "Web file explorer, guarded archives, trash, users & roles, notifications, verified updates and an administrator-only Linux terminal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <style>{`
          .site-outlet > .min-h-screen > header:first-child,
          .site-outlet > .min-h-screen > footer:last-child {
            display: none;
          }
        `}</style>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SiteNav />
      <div className="site-outlet">
        <Outlet />
      </div>
      <HomeAdminCommandEnhancer />
      <SiteFooter />
    </QueryClientProvider>
  );
}

function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 text-foreground backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <a href="/" className="text-sm font-semibold tracking-tight">
          wFileManager
        </a>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="/#features" className="hover:text-foreground">Features</a>
          <a href="/pricing" className="hover:text-foreground">Pricing</a>
          <a href={DOCS} className="hover:text-foreground">Docs</a>
          <a href="/about" className="hover:text-foreground">About</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeSelector />
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

function ThemeSelector() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const storedPreference = localStorage.getItem("theme-preference") as ThemeMode | null;
    const legacyTheme = localStorage.getItem("theme");
    const initial: ThemeMode =
      storedPreference === "system" || storedPreference === "light" || storedPreference === "dark"
        ? storedPreference
        : legacyTheme === "light" || legacyTheme === "dark"
          ? legacyTheme
          : "system";

    setMode(initial);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const resolved = mode === "system" ? (media.matches ? "dark" : "light") : mode;
      document.documentElement.classList.toggle("dark", resolved === "dark");
      localStorage.setItem("theme-preference", mode);
      localStorage.setItem("theme", resolved);
    };

    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mode]);

  const options: Array<{ value: ThemeMode; label: string; icon: (props: IconProps) => ReactNode }> = [
    { value: "system", label: "Use system theme", icon: SystemIcon },
    { value: "light", label: "Use light theme", icon: SunIcon },
    { value: "dark", label: "Use dark theme", icon: MoonIcon },
  ];

  return (
    <div className="inline-flex items-center rounded-md border border-border bg-background p-0.5" aria-label="Theme preference">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setMode(value)}
          aria-label={label}
          aria-pressed={mode === value}
          title={label}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-sm transition-colors ${
            mode === value
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

function enhanceAdminCommands(target: Element) {
  target.className = "mx-auto mt-12 max-w-3xl divide-y divide-border border-y border-border";

  Array.from(target.children).forEach((child) => {
    if (!(child instanceof HTMLElement) || child.dataset.copyEnhanced === "true") return;

    const label = child.querySelector("div")?.textContent?.trim() || "Command";
    const code = child.querySelector("code")?.textContent?.trim() || "";
    if (!code) return;

    child.dataset.copyEnhanced = "true";
    child.className = "flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between";

    const labelEl = child.querySelector("div");
    if (labelEl) labelEl.className = "text-[11px] uppercase tracking-wider text-muted-foreground";

    const pre = child.querySelector("pre");
    if (pre) pre.className = "mt-1 overflow-x-auto bg-transparent p-0 font-mono text-[12px] leading-relaxed text-foreground";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Copy";
    button.dataset.copyButton = "true";
    button.className = "btn-ghost btn-ghost-hover inline-flex shrink-0 items-center justify-center rounded-md px-2.5 py-1.5 text-[11px] font-medium";
    button.setAttribute("aria-label", `Copy ${label} command`);
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = "Copied";
        window.setTimeout(() => {
          button.textContent = "Copy";
        }, 1500);
      } catch {
        button.textContent = "Copy failed";
        window.setTimeout(() => {
          button.textContent = "Copy";
        }, 1500);
      }
    });
    child.appendChild(button);
  });
}

function HomeAdminCommandEnhancer() {
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    if (window.location.pathname !== "/") return;

    const locateTarget = () => {
      const found = document.querySelector("#admin .space-y-3, #admin .divide-y");
      if (!found) return;
      enhanceAdminCommands(found);
      setTarget(found);
    };

    locateTarget();
    const frame = window.requestAnimationFrame(locateTarget);
    const timer = window.setInterval(locateTarget, 500);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  if (!target) return null;

  return createPortal(
    <ShellCommandRow label="Uninstall wFileManager" cmd={UNINSTALL_CMD} />,
    target,
  );
}

function ShellCommandRow({ label, cmd }: { label: string; cmd: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <code className="mt-1 block overflow-x-auto whitespace-nowrap font-mono text-[12px] leading-relaxed text-foreground">
          {cmd}
        </code>
      </div>
      <button
        type="button"
        onClick={copy}
        className="btn-ghost btn-ghost-hover inline-flex shrink-0 items-center justify-center rounded-md px-2.5 py-1.5 text-[11px] font-medium"
        aria-label={`Copy ${label} command`}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row">
        <span>
          <span className="text-foreground">wFileManager</span> · Developed by KmerHosting LLC
        </span>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <a href={GITHUB} target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a>
          <a href={`${GITHUB}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer" className="hover:text-foreground">Contribute</a>
          <a href={`${GITHUB}/blob/main/SECURITY.md`} target="_blank" rel="noreferrer" className="hover:text-foreground">Security</a>
          <a href={`${GITHUB}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="hover:text-foreground">MIT License</a>
        </div>
      </div>
    </footer>
  );
}

function SystemIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function SunIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 4V2M12 22v-2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function MoonIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function GithubIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.3.1 1.9 1.3 1.9 1.3 1.1 1.9 3 1.4 3.7 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 0 1 1.2-3.3c-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0C17 4.8 18 5 18 5c.7 1.7.2 2.9.1 3.1.8.9 1.2 2 1.2 3.3 0 4.7-2.8 5.7-5.5 6 .5.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}
