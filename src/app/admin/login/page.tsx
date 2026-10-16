import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/admin/login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Admin sign-in" };

export default function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Admin sign-in</h1>
        <p className="text-muted-foreground">
          For admins who review TODA submissions. We&apos;ll email you a one-time link; there is no password.
        </p>
      </header>
      {/* Only the notice waits for the query, so the form stays put while someone types. */}
      <LoginForm
        notice={
          <Suspense>
            <LinkFailedNotice searchParams={searchParams} />
          </Suspense>
        }
      />
    </main>
  );
}

async function LinkFailedNotice({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const { error } = await searchParams;
  if (error === undefined) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>That sign-in link has expired or was already used. Request a new one.</AlertDescription>
    </Alert>
  );
}
