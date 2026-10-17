import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { deleteAccount, deleteRecord, updatePersonDetails, type PersonRecord } from "@/app/[lang]/admin/data/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { PersonDetailsForm } from "@/components/admin/person-details-form";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findPersonalData, MIN_QUERY_LENGTH, type PersonalData } from "@/lib/privacy/lookup";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Data requests" };

const dateTime = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export default async function AdminDataPage({ searchParams }: PageProps<"/[lang]/admin/data">) {
  // Checked before anything streams, so a signed-out visitor gets a real 307 to the
  // sign-in page instead of a redirect sent mid-stream with a 200.
  const admin = await requireAdmin();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Data requests</h1>
        <AdminNav current="data" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>Signed in as {admin.email}</p>
        <SignOutButton />
      </div>

      <p className="max-w-prose text-pretty">
        Find everything we hold about one person to answer a request to see, correct or delete their data, as the{" "}
        <Link href="/privacy#rights" className="font-semibold text-primary underline-offset-4 hover:underline">
          Privacy Policy
        </Link>{" "}
        promises. Confirm the request came from that person (for example, the email came from the same address) and
        reply within 30 days.
      </p>

      <form role="search" className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-64 flex-1 flex-col gap-1.5 text-sm font-semibold">
          Name, email or phone number
          <Input name="q" type="search" defaultValue={query} minLength={MIN_QUERY_LENGTH} required className="h-11" />
        </label>
        <Button type="submit" size="lg" className="h-11">
          Search
        </Button>
      </form>

      {query.length >= MIN_QUERY_LENGTH ? (
        <Suspense key={query} fallback={<p className="text-muted-foreground">Searching…</p>}>
          <Results query={query} />
        </Suspense>
      ) : (
        query && <p className="text-muted-foreground">Type at least {MIN_QUERY_LENGTH} characters.</p>
      )}
    </main>
  );
}

async function Results({ query }: { query: string }) {
  const data = await findPersonalData(query);
  const total = data.accounts.length + data.feedback.length + data.todaSubmissions.length + data.routeSubmissions.length;

  if (total === 0) {
    return <p className="rounded-xl border border-dashed p-6 text-muted-foreground">Nothing matches “{query}”.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <Group title="Sign-in accounts" count={data.accounts.length}>
        {data.accounts.map((account) => (
          <Record key={account.id} title={account.name ?? account.email ?? account.id}>
            <Details
              rows={[
                ["Email", account.email ?? "None"],
                ["Signed in with", account.provider],
                ["Created", dateTime.format(account.createdAt)],
                ["Last sign-in", account.lastSignInAt ? dateTime.format(account.lastSignInAt) : "Never"],
              ]}
            />
            {account.isAdmin ? (
              <Badge variant="secondary">Admin account: remove it from ADMIN_EMAILS before deleting</Badge>
            ) : (
              <ConfirmDeleteButton
                label="Delete account"
                warning="Deletes this sign-in account and all feedback it sent."
                action={deleteAccount.bind(null, account.id)}
              />
            )}
          </Record>
        ))}
      </Group>

      <Group title="Feedback" count={data.feedback.length}>
        {data.feedback.map((entry) => (
          <Record key={entry.id} title={`Feedback ${entry.id.slice(-6).toUpperCase()}`}>
            <Details
              rows={[
                ["Name", entry.userName ?? "None"],
                ["Email", entry.userEmail ?? "None"],
                ["Sent", dateTime.format(new Date(entry.createdAt))],
                ["Page", entry.pagePath ?? "None"],
                ["Message", entry.message],
              ]}
            />
            <Actions record="feedback" id={entry.id} name={entry.userName} contact={entry.userEmail} contactLabel="Email" />
          </Record>
        ))}
      </Group>

      <Group title="TODA submissions" count={data.todaSubmissions.length}>
        {data.todaSubmissions.map((submission) => (
          <Record key={submission.id} title={submission.name}>
            <Details
              rows={[
                ["Name", submission.submitterName ?? "None"],
                ["Contact", submission.submitterContact ?? "None"],
                ["Sent", dateTime.format(new Date(submission.createdAt))],
                ["Status", submission.status],
                ["Notes", submission.notes ?? "None"],
              ]}
            />
            <Actions
              record="toda"
              id={submission.id}
              name={submission.submitterName}
              contact={submission.submitterContact}
              contactLabel="Contact"
            />
          </Record>
        ))}
      </Group>

      <Group title="Jeep route submissions" count={data.routeSubmissions.length}>
        {data.routeSubmissions.map((submission) => (
          <Record key={submission.id} title={submission.name}>
            <Details
              rows={[
                ["Name", submission.submitterName ?? "None"],
                ["Contact", submission.submitterContact ?? "None"],
                ["Sent", dateTime.format(new Date(submission.createdAt))],
                ["Status", submission.status],
                ["Notes", submission.notes ?? "None"],
              ]}
            />
            <Actions
              record="route"
              id={submission.id}
              name={submission.submitterName}
              contact={submission.submitterContact}
              contactLabel="Contact"
            />
          </Record>
        ))}
      </Group>

      <AccessCopy data={data} />
    </div>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold tracking-tight">
        {title} <span className="text-base font-semibold text-muted-foreground tabular-nums">({count})</span>
      </h2>
      {count > 0 ? <ul className="flex flex-col gap-3">{children}</ul> : <p className="text-muted-foreground">None.</p>}
    </section>
  );
}

function Record({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="flex flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground">
      <h3 className="font-bold">{title}</h3>
      {children}
    </li>
  );
}

function Details({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="font-semibold text-muted-foreground">{label}</dt>
          <dd className="break-words whitespace-pre-wrap">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Actions({
  record,
  id,
  name,
  contact,
  contactLabel,
}: {
  record: PersonRecord;
  id: string;
  name: string | null;
  contact: string | null;
  contactLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <PersonDetailsForm
        name={name}
        contact={contact}
        contactLabel={contactLabel}
        action={updatePersonDetails.bind(null, record, id)}
      />
      <ConfirmDeleteButton
        label="Delete"
        warning={record === "feedback" ? "Deletes this feedback." : "Deletes this submission. A published entry stays, without the submitter's details."}
        action={deleteRecord.bind(null, record, id)}
      />
    </div>
  );
}

/** Everything found, as JSON an admin can copy into a reply to an access request. */
function AccessCopy({ data }: { data: PersonalData }) {
  return (
    <details className="rounded-xl border bg-card p-4">
      <summary className="cursor-pointer font-semibold">Copy for an access request (JSON)</summary>
      <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}
