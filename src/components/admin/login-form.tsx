"use client";

import { MailCheck } from "lucide-react";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useHydrated } from "@/hooks/use-hydrated";
import { authClient } from "@/lib/auth-client";

/** `notice` is the server-rendered "link expired" message, if any. */
export function LoginForm({ notice }: { notice?: ReactNode }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Until hydration the browser would submit natively and put the email in the URL.
  const hydrated = useHydrated();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter the email address you use as an admin.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const { error: signInError } = await authClient.signIn.magicLink({
        email,
        callbackURL: "/admin/todas",
        errorCallbackURL: "/admin/login?error=link",
      });
      if (signInError) {
        setError(
          signInError.status === 429
            ? "Too many tries. Wait a minute, then try again."
            : "We couldn't send the link. Try again in a moment.",
        );
        return;
      }
      setSentTo(email);
    });
  }

  if (sentTo) {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
        <MailCheck aria-hidden="true" className="size-8 text-primary" />
        <h2 className="text-lg font-bold">Check your email</h2>
        <p className="text-muted-foreground">
          If <span className="font-semibold text-foreground">{sentTo}</span> is on the admin list, a
          sign-in link is on its way. It works once and expires in 10 minutes.
        </p>
        <Button variant="ghost" onClick={() => setSentTo(null)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} method="post" noValidate className="flex flex-col gap-4">
      {notice}
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="admin-email">Admin email</FieldLabel>
        <Input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={error ? true : undefined}
          className="h-11"
        />
        <FieldError>{error}</FieldError>
      </Field>
      <Button type="submit" size="lg" className="h-11 font-bold" disabled={!hydrated || isPending}>
        {isPending ? "Sending…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
