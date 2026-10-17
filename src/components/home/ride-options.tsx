import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { UnconfirmedBadge } from "@/components/home/unconfirmed-badge";
import { JeepIcon, TricycleIcon } from "@/components/shared/vehicle-icons";
import { jeepRules, tricycleRules, tricycleSource } from "@/lib/data";
import { formatPeso } from "@/lib/fare";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fill, localizePath } from "@/lib/i18n/locales";

export async function RideOptions() {
  const { locale, dict } = await getDictionary();
  const t = dict.home;
  const farePath = localizePath(locale, "/fare");
  const { traditional, modern } = jeepRules.types;

  const rides = [
    {
      key: "jeep",
      href: `${farePath}?mode=jeep`,
      Icon: JeepIcon,
      title: t.jeepTitle,
      description: t.jeepDescription,
      from: Math.min(traditional.baseFare, modern.baseFare),
      unconfirmed: false,
    },
    {
      key: "tricycle",
      href: farePath,
      Icon: TricycleIcon,
      title: t.tricycleTitle,
      description: t.tricycleDescription,
      from: tricycleRules.baseFare.regular,
      unconfirmed: !tricycleSource.confirmed,
    },
  ];

  return (
    <section aria-labelledby="modes-heading" className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <h2 id="modes-heading" className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t.modesHeading}
      </h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {rides.map(({ key, href, Icon, title, description, from, unconfirmed }) => (
          <li key={key}>
            <Link
              href={href}
              className="group flex h-full items-start gap-4 rounded-2xl border bg-card p-5 text-card-foreground transition-[border-color,transform] duration-150 ease-out hover:border-primary active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-6"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-8" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-xl font-extrabold tracking-tight">{title}</span>
                  {unconfirmed && <UnconfirmedBadge label={t.unconfirmed} />}
                </span>
                <span className="text-sm text-pretty text-muted-foreground">{description}</span>
                <span className="mt-auto pt-2 font-bold text-primary tabular-nums">
                  {fill(t.fromFare, { amount: formatPeso(from) })}
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="mt-1 size-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
