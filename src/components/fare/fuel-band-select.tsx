"use client";

import { useId } from "react";

import { useDictionary } from "@/components/shared/dictionary-provider";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { formatPeso, type FuelBand } from "@/lib/fare";
import { fill } from "@/lib/i18n/locales";

/** The band's gasoline prices, ready for the `{from}` and `{to}` placeholders. */
export const bandRange = (band: FuelBand): { from: string; to: string } => ({
  from: formatPeso(band.gasolineFrom),
  to: formatPeso(band.gasolineTo),
});

type FuelBandSelectProps = {
  bands: FuelBand[];
  /** Index into bands; 0 is the base rate. */
  value: number;
  onChange: (index: number) => void;
};

export function FuelBandSelect({ bands, value, onChange }: FuelBandSelectProps) {
  const { dict } = useDictionary();
  const t = dict.tricycle.fuelBand;
  const selectId = useId();
  const hintId = useId();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={selectId} className="font-medium">
        {t.label}
      </label>
      <NativeSelect
        id={selectId}
        aria-describedby={hintId}
        // text-base keeps iOS from zooming the page when the select is focused.
        className="w-full [&_select]:h-11 [&_select]:text-base"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {bands.map((band, index) => (
          <NativeSelectOption key={band.gasolineFrom} value={index}>
            {fill(index === 0 ? t.baseOption : t.option, bandRange(band))}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <p id={hintId} className="text-sm text-muted-foreground">
        {t.hint}
      </p>
    </div>
  );
}
