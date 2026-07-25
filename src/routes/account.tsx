import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "../components/MarketingLayout";
import { CustomerAccount } from "../components/CustomerAccount";
import { CustomerInvoices } from "../components/CustomerInvoices";
import { CustomerAuthActions } from "../components/CustomerAuthActions";
import { CustomerSessions } from "../components/CustomerSessions";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Licence keys and balance — wFileManager" },
      {
        name: "description",
        content:
          "Manage your USD account balance, wFileManager Pro licence keys, renewals, sessions, invoices and account security.",
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 py-14 md:py-18">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Licence keys</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              View your product keys, USD balance, activation status, expiry, renewals and account
              security.
            </p>
          </div>
          <div className="mt-6">
            <CustomerAuthActions />
          </div>
          <CustomerAccount />
          <div className="mt-6 grid gap-6">
            <CustomerSessions />
            <CustomerInvoices />
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
