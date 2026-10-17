import { UserRound } from "lucide-react";

import { signOutRider } from "@/app/[lang]/feedback/actions";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fill } from "@/lib/i18n/locales";
import type { Rider } from "@/lib/session";
import { cn } from "@/lib/utils";

type SignedInBarProps = {
  rider: Rider;
  /** The page the rider came from, already checked to be on this site. */
  from?: string;
  /** The page to come back to after signing out, when it isn't the feedback page. */
  returnTo?: string;
  className?: string;
};

/** Who is signed in, with a sign-out button that returns to the same page. */
export async function SignedInBar({ rider, from, returnTo, className }: SignedInBarProps) {
  const { locale, dict } = await getDictionary();
  return (
    <div className={cn("flex items-center gap-3 px-4 py-2 sm:px-6", className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <UserRound aria-hidden className="size-4 text-muted-foreground" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col text-sm">
        <p className="font-semibold break-words">
          {fill(dict.feedback.signedInAs, { name: rider.name ?? rider.email ?? "" })}
        </p>
        {rider.name && rider.email && <p className="truncate text-muted-foreground">{rider.email}</p>}
      </div>
      <form action={signOutRider}>
        <input type="hidden" name="locale" value={locale} />
        {from && <input type="hidden" name="from" value={from} />}
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
        <Button type="submit" variant="ghost" className="h-11">
          {dict.feedback.signOut}
        </Button>
      </form>
    </div>
  );
}
