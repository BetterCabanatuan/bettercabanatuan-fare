import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { tricycleHotline, tricyclePenalties } from "@/lib/data";
import { formatPeso } from "@/lib/fare";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { fill } from "@/lib/i18n/locales";

/** Where to report a tricycle overcharge, and what the ordinance does to drivers who do it (Sec. 8). */
export async function TricycleComplaints() {
  const { dict } = await getDictionary();
  const t = dict.tricycle.complaints;
  const number = tricycleHotline.replaceAll("-", "");

  return (
    <aside aria-label={t.title} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 text-card-foreground">
      <div className="flex flex-col gap-1">
        <p className="font-bold tracking-tight">{t.title}</p>
        <p className="text-sm text-pretty text-muted-foreground">{t.body}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button render={<a href={`tel:${number}`} />} nativeButton={false} variant="outline" className="h-11">
          <Phone aria-hidden />
          {fill(t.call, { number: tricycleHotline })}
        </Button>
        <Button render={<a href={`sms:${number}`} />} nativeButton={false} variant="outline" className="h-11">
          {fill(t.text, { number: tricycleHotline })}
        </Button>
      </div>
      <div className="flex flex-col gap-1 border-t pt-3">
        <p className="text-sm font-semibold">{t.penaltiesTitle}</p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
          {tricyclePenalties.map((penalty) => (
            <li key={penalty.offense}>
              {"fine" in penalty
                ? fill(t.fineOrImpound, { n: penalty.offense, fine: formatPeso(penalty.fine), days: penalty.impoundDays })
                : fill(t.mtopRevoked, { n: penalty.offense })}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">{t.penaltiesNote}</p>
      </div>
    </aside>
  );
}
