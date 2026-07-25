import * as React from "react";

const GITHUB = "https://github.com/toscani-tenekeu/wFileManager";
const DOCS = "https://kmerhosting.com/docs";

type ThemePreference = "system" | "light" | "dark";
type IconProps = { className?: string };

function StrokeIcon({ className, path }: IconProps & { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}

function applyThemePreference(theme: ThemePreference) {
  const shouldUseDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", shouldUseDark);
}

function ThemeSelector() {
  const [theme, setTheme] = React.useState<ThemePreference>("system");

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const stored = localStorage.getItem("theme");
    const initial: ThemePreference =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system";

    setTheme(initial);
    applyThemePreference(initial);

    const onSystemThemeChange = () => {
      if ((localStorage.getItem("theme") ?? "system") === "system") {
        applyThemePreference("system");
      }
    };

    media.addEventListener("change", onSystemThemeChange);
    return () => media.removeEventListener("change", onSystemThemeChange);
  }, []);

  const options: Array<{
    value: ThemePreference;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      value: "system",
      label: "System theme",
      icon: <StrokeIcon className="h-3.5 w-3.5" path="M4 5h16v12H4zM8 21h8M12 17v4" />,
    },
    {
      value: "light",
      label: "Light theme",
      icon: <StrokeIcon className="h-3.5 w-3.5" path="M12 4V2M12 22v-2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8" />,
    },
    {
      value: "dark",
      label: "Dark theme",
      icon: <StrokeIcon className="h-3.5 w-3.5" path="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
    },
  ];

  const selectTheme = (next: ThemePreference) => {
    setTheme(next);
    applyThemePreference(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      role="group"
      aria-label="Theme preference"
      className="inline-flex items-center rounded-md border border-border bg-background p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => selectTheme(option.value)}
          aria-label={option.label}
          aria-pressed={theme === option.value}
          title={option.label}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-[5px] transition-colors ${
            theme === option.value
              ? "bg-[var(--surface-2)] text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

function GithubIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.3.1 1.9 1.3 1.9 1.3 1.1 1.9 3 1.4 3.7 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 0 1 1.2-3.3c-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0C17 4.8 18 5 18 5c.7 1.7.2 2.9.1 3.1.8.9 1.2 2 1.2 3.3 0 4.7-2.8 5.7-5.5 6 .5.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <a href="/" className="text-sm font-semibold tracking-tight">
            wFileManager
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="/#features" className="hover:text-foreground">Features</a>
            <a href="/pricing" className="hover:text-foreground">Pricing</a>
            <a href="/account" className="hover:text-foreground">Dashboard</a>
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

      <main>{children}</main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row">
          <span><span className="text-foreground">wFileManager</span> · A project by KmerHosting LLC</span>
          <div className="flex items-center gap-6">
            <a href="/account" className="hover:text-foreground">Dashboard</a>
            <a href={GITHUB} target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a>
            <a href={`${GITHUB}/blob/main/SECURITY.md`} target="_blank" rel="noreferrer" className="hover:text-foreground">Security</a>
            <a href={`${GITHUB}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="hover:text-foreground">MIT License</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
