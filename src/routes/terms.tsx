import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "../components/MarketingLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — wFileManager" },
      {
        name: "description",
        content:
          "Terms for wFileManager Community and Pro managed application-data service, including licence keys, USD account balance, automatic renewals and billing lifecycle.",
      },
    ],
  }),
  component: TermsPage,
});

const SUPPORT_EMAIL = "support@kmerhosting.com";

function TermsPage() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden border-b border-border bg-background text-foreground">
        <div className="absolute inset-0 grid-bg" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 py-24 md:py-32">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] brand-text">Legal</p>
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Terms of Use
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-base">
              These terms govern use of wFileManager, including Community installations and Pro
              managed application-data services provided by KmerHosting LLC.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">Last updated: 2026-07-25</p>
          </div>

          <div className="mt-12 space-y-6">
            <TermSection title="1. Editions">
              <p>wFileManager has two editions.</p>
              <ul>
                <li>
                  <strong>Community:</strong> free software that stores wFileManager application
                  records locally in SQLite on the user's server.
                </li>
                <li>
                  <strong>Pro:</strong> paid managed application data for wFileManager records,
                  priced at $100 USD per instance per year with 5 GB included. Additional capacity
                  costs $1 USD per GB per month.
                </li>
              </ul>
              <p>
                Both editions expose the same file-manager features. The difference is where
                wFileManager stores its own application records and who is responsible for backup
                and recovery of those records.
              </p>
            </TermSection>

            <TermSection title="2. Pro licence keys and payment">
              <p>
                A new Pro installation requires a valid paid licence key before the first
                administrator account can be created. A licence key may be limited to a specific
                instance, customer, order, period or storage quota.
              </p>
              <p>
                The customer can purchase a key using available USD account balance or pay directly.
                For direct CamerPay checkout, the customer returns to the dashboard and clicks{" "}
                <strong>Check status</strong>. If payment is confirmed, the dashboard displays the
                licence key and sends its English confirmation email once.
              </p>
              <p>
                A Pro licence key authorizes only the managed wFileManager application-data service.
                It does not grant server infrastructure, domain registration, filesystem backup,
                website hosting, database hosting or other services unless those are purchased
                separately.
              </p>
            </TermSection>

            <TermSection title="3. USD account balance and top-ups">
              <p>
                The customer dashboard may provide a prepaid account balance denominated in USD. The
                balance is account credit for eligible wFileManager purchases and renewals; it is
                not a bank account, does not earn interest and cannot become negative.
              </p>
              <p>
                Top-ups are requested in USD. A payment provider may process the corresponding
                settlement through another supported payment currency internally. The amount
                credited to the wFileManager account remains the USD amount shown before payment.
              </p>
              <p>
                A top-up or wallet transaction is applied once using an idempotent transaction
                reference. The dashboard displays the resulting balance and transaction history.
              </p>
            </TermSection>

            <TermSection title="4. Renewal and automatic renewal">
              <p>
                An activated Pro licence can be renewed using available account balance or direct
                payment. Renewal keeps the same licence key and instance. If renewed before expiry,
                the new period is added after the existing paid-through date.
              </p>
              <p>
                Automatic renewal can be enabled or disabled for each activated instance. When
                enabled, the system attempts to charge the current annual Pro price from the USD
                balance about 7 days before expiry.
              </p>
              <p>
                If the balance is sufficient, the charge and renewal are applied atomically and the
                customer receives an English confirmation email. If the balance is insufficient, no
                partial charge and no negative balance are created. The customer receives a notice
                and may add funds or pay the renewal directly.
              </p>
            </TermSection>

            <TermSection title="5. Unpaid Pro lifecycle">
              <p>When a Pro subscription becomes unpaid, the following lifecycle applies:</p>
              <ul>
                <li>the service enters a grace period after the paid-through date passes;</li>
                <li>
                  more than 7 days unpaid may suspend the Pro managed application-data account and
                  revoke sessions;
                </li>
                <li>
                  more than 30 days unpaid may permanently delete the Pro managed application data
                  and remote instance account.
                </li>
              </ul>
              <p>
                Deletion covers only wFileManager application records stored by the Pro backend.
                Server filesystem files, websites, databases, uploads, directories, mounted volumes
                and operating-system configuration are not part of Pro managed application data.
              </p>
            </TermSection>

            <TermSection title="6. Uninstalling">
              <p>
                Community uninstall removes the local application, local SQLite records and
                configuration from the server.
              </p>
              <p>Pro uninstall has two separate choices:</p>
              <ul>
                <li>
                  <strong>local-only removal:</strong> removes the server installation but keeps the
                  paid Pro managed application data and subscription for later recovery;
                </li>
                <li>
                  <strong>permanent Pro deletion:</strong> deletes the remote managed application
                  data and instance account, then removes the local installation.
                </li>
              </ul>
              <p>
                Permanent Pro deletion requires the saved Recovery Kit. If the Recovery Kit does not
                match the remote account, remote deletion is rejected.
              </p>
            </TermSection>

            <TermSection title="7. Operator responsibility">
              <p>
                The server administrator remains responsible for choosing correct paths and
                commands, maintaining server filesystem backups, backing up
                websites/databases/uploads, protecting root access and Recovery Kit files, and
                complying with laws, hosting-provider rules and third-party software licences.
              </p>
              <p>
                wFileManager can operate with elevated privileges. Incorrect operations can cause
                permanent data loss, service interruption or server compromise.
              </p>
            </TermSection>

            <TermSection title="8. Self-service and technical support">
              <p>
                Licence purchase, top-up, payment verification, balance use, renewal and
                automatic-renewal settings are available through the customer dashboard without
                staff intervention.
              </p>
              <p>
                Technical and security support contact:{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium brand-text hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
              <p>
                Security issues should include enough detail to reproduce the issue. Do not publicly
                disclose exploitable vulnerabilities before reasonable coordination.
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
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
