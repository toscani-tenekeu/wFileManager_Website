import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, ShieldCheck, TerminalSquare, UploadCloud } from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({ meta: [{ title: "Documentation | wFileManager" }] }),
  component: Docs,
});

const sections = [
  {
    title: "Getting started",
    body: [
      "Install wFileManager on a supported Ubuntu server using the official installer, then open /setup to create the first administrator.",
      "The administrator account is an application account. It does not create a Linux user.",
      "Application state is stored under /var/lib/wfilemanager. Include it in your server backup policy.",
    ],
  },
  {
    title: "File Explorer",
    body: [
      "Browse the real Linux filesystem using breadcrumbs, path navigation, list or mosaic view and optional hidden-file display.",
      "Create, preview, edit, download, rename, copy, move, change permissions and delete files from the item menu.",
      "wFileManager blocks writes through symbolic links into protected kernel-managed locations such as /proc, /sys, /dev and /run.",
    ],
  },
  {
    title: "Transfers and background tasks",
    body: [
      "Choose an upload destination with the folder browser, recent locations or shortcuts. Files are written to a temporary location and committed only when complete.",
      "The Background tasks page keeps uploads, copy, move and delete operations visible while you navigate the application.",
      "Cancelable tasks can be stopped safely. Completed, failed and cancelled tasks remain available for review during the session.",
    ],
  },
  {
    title: "Archives and trash",
    body: [
      "Create ZIP or TAR.GZ archives. Extraction validates paths, links, entry counts, expanded size, compression ratio and destination space before writing files.",
      "Deleted files go to the private wFileManager trash first. Restore never overwrites an existing original path. Permanent deletion cannot be undone.",
    ],
  },
  {
    title: "Users, roles and permissions",
    body: [
      "Application users and roles are separate from Linux accounts. Linux permissions still apply after a wFileManager role allows an action.",
      "Administrators manage users, roles, sessions and notifications. Changing an application password never changes a Linux password.",
      "Avoid broad permissions such as 0777. Confirm absolute paths before modifying server files.",
    ],
  },
  {
    title: "Administrator terminal",
    body: [
      "The terminal is restricted to administrators and asks for the current application password before opening a root shell.",
      "Commands run directly as root and can affect the entire server. They are not reversible by wFileManager.",
    ],
  },
  {
    title: "Backups",
    body: [
      "Back up /var/lib/wfilemanager with the rest of your server state.",
      "Test restore procedures before relying on them and keep copies outside the server.",
      "Server files, websites and databases require their own backup policy.",
    ],
  },
  {
    title: "Updates and recovery",
    body: [
      "Stable updates are downloaded, checked by checksum and size, built in a separate release, health-checked and rolled back automatically if unhealthy.",
      "After a server replacement, restore the application state from your tested backup.",
      "Never expose the internal Node port. Access wFileManager through HTTPS and Nginx.",
    ],
  },
];

function Docs() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <a href="/" className="text-sm font-semibold tracking-tight">
            wFileManager
          </a>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="mb-10 max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" />
            Documentation
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Operate wFileManager safely.</h1>
          <p className="mt-4 text-muted-foreground">
            Guidance for installation, file management, transfers, administration and recovery.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section, index) => {
            const Icon =
              index === 2
                ? UploadCloud
                : index === 5
                  ? TerminalSquare
                  : index === 4
                    ? ShieldCheck
                    : BookOpen;
            return (
              <section key={section.title} className="rounded-xl border border-border bg-card p-6">
                <Icon className="mb-4 h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {section.body.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
