import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

import { signInWithProvider } from "@/app/[lang]/feedback/actions";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizePath } from "@/lib/i18n/locales";

type SignInOptionsProps = {
  /** The page the rider came from, already checked to be on this site. */
  from?: string;
  signInFailed: boolean;
};

/** Google and Facebook sign-in. Plain forms, so they work before the page's JavaScript loads. */
export async function SignInOptions({ from, signInFailed }: SignInOptionsProps) {
  const { locale, dict } = await getDictionary();
  const t = dict.feedback;
  const providers = [
    { id: "google", label: t.continueGoogle, Icon: GoogleIcon },
    { id: "facebook", label: t.continueFacebook, Icon: FacebookIcon },
  ] satisfies { id: string; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[];

  return (
    <section aria-labelledby="sign-in-heading" className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <div className="flex flex-col gap-1">
        <h2 id="sign-in-heading" className="text-xl font-bold tracking-tight">
          {t.signInHeading}
        </h2>
        <p className="text-pretty text-muted-foreground">{t.signInWhy}</p>
      </div>

      {signInFailed && (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden />
          <AlertTitle>{t.signInFailed}</AlertTitle>
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        {providers.map(({ id, label, Icon }) => (
          <form key={id} action={signInWithProvider}>
            <input type="hidden" name="provider" value={id} />
            <input type="hidden" name="locale" value={locale} />
            {from && <input type="hidden" name="from" value={from} />}
            <Button type="submit" variant="outline" size="lg" className="h-12 w-full gap-3 text-base font-semibold">
              <Icon aria-hidden className="size-5" />
              {label}
            </Button>
          </form>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {t.consentBefore}{" "}
        <Link href={localizePath(locale, "/terms")} className="font-semibold text-primary underline-offset-4 hover:underline">
          {dict.terms.title}
        </Link>{" "}
        {t.consentAnd}{" "}
        <Link href={localizePath(locale, "/privacy")} className="font-semibold text-primary underline-offset-4 hover:underline">
          {dict.privacy.title}
        </Link>
        . {t.privacy}
      </p>
    </section>
  );
}

// Brand marks as each provider's sign-in guidelines draw them.
function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#0866FF"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.8V24C19.62 23.1 24 18.1 24 12.07z"
      />
    </svg>
  );
}
