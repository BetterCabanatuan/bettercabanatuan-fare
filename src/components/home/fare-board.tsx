import { UnconfirmedBadge } from "@/components/home/unconfirmed-badge";
import { jeepRules, tricycleRules, tricycleSource } from "@/lib/data";
import { formatPeso, type JeepFareRule } from "@/lib/fare";
import { formatDate } from "@/lib/format-date";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fill } from "@/lib/i18n/locales";

export async function FareBoard() {
  const { dict } = await getDictionary();
  const t = dict.home;
  const { traditional, modern } = jeepRules.types;
  const jeepRule = (rule: JeepFareRule) =>
    fill(t.fareBoardJeepRule, { baseKm: rule.baseKm, perKm: formatPeso(rule.perSucceedingKm) });

  const rows = [
    { key: "traditional", name: t.fareBoardTraditional, amount: traditional.baseFare, rule: jeepRule(traditional) },
    { key: "modern", name: t.fareBoardModern, amount: modern.baseFare, rule: jeepRule(modern) },
    {
      key: "tricycle",
      name: t.fareBoardTricycle,
      amount: tricycleRules.regular.solo,
      rule: fill(t.fareBoardTricycleRule, {
        baseKm: tricycleRules.baseKm,
        perKm: formatPeso(tricycleRules.perSucceedingKmPerPassenger),
      }),
      unconfirmed: !tricycleSource.confirmed,
    },
  ];

  return (
    <section
      aria-labelledby="fare-board-heading"
      className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-lg"
    >
      <h2
        id="fare-board-heading"
        className="bg-foreground px-5 py-3 text-sm font-extrabold tracking-widest text-highlight uppercase"
      >
        {t.fareBoardTitle}
      </h2>
      <dl className="divide-y px-5">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 py-4">
            <dt className="flex min-w-0 flex-col gap-1">
              <span className="font-bold">{row.name}</span>
              <span className="text-sm text-muted-foreground tabular-nums">{row.rule}</span>
              {row.unconfirmed && <UnconfirmedBadge label={t.unconfirmed} />}
            </dt>
            <dd className="shrink-0 text-3xl font-extrabold tracking-tight tabular-nums">{formatPeso(row.amount)}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t bg-muted px-5 py-3 text-sm text-muted-foreground tabular-nums">
        {fill(t.fareBoardFooter, {
          percent: Math.round(jeepRules.discountRate * 100),
          date: formatDate(jeepRules.effectiveDate),
        })}
      </p>
    </section>
  );
}
