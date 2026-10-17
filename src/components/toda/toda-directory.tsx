"use client";

import { LayoutGrid, MapPin, Phone, Search, Table2 } from "lucide-react";
import { useDeferredValue, useId, useRef, useState, type RefObject } from "react";

import { useDictionary } from "@/components/shared/dictionary-provider";
import { TodaCards } from "@/components/toda/toda-cards";
import { TodaTable } from "@/components/toda/toda-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { fill } from "@/lib/i18n/locales";
import { filterTodas, isFiltered, NO_TODA_FILTER, todaBarangays, type TodaFilter } from "@/lib/toda/directory";
import type { TodaListItem } from "@/lib/toda/queries";

type View = "cards" | "table";

/** The verified TODA list with filters for "which TODA serves my barangay?". */
export function TodaDirectory({ todas }: { todas: TodaListItem[] }) {
  const { dict } = useDictionary();
  const searchRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState(NO_TODA_FILTER);
  const [view, setView] = useState<View>("cards");
  const deferredFilter = useDeferredValue(filter);
  const matches = filterTodas(todas, deferredFilter);

  return (
    <div className="flex flex-col gap-4">
      <TodaFilters
        filter={filter}
        onChange={setFilter}
        barangays={todaBarangays(todas)}
        searchRef={searchRef}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" aria-atomic className="text-sm text-muted-foreground tabular-nums">
          {isFiltered(deferredFilter)
            ? fill(dict.toda.filterCount, { shown: matches.length, total: todas.length })
            : todas.length === 1
              ? dict.toda.countOne
              : fill(dict.toda.count, { total: todas.length })}
        </p>
        <ViewToggle view={view} onChange={setView} />
      </div>
      {matches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center text-sm">
          <p>{dict.toda.noMatch}</p>
          <Button
            variant="outline"
            className="h-11"
            onClick={() => {
              setFilter(NO_TODA_FILTER);
              // The button disappears once TODAs show again, so focus goes back to the search box.
              searchRef.current?.focus();
            }}
          >
            {dict.toda.clearFilters}
          </Button>
        </div>
      ) : view === "cards" ? (
        <TodaCards todas={matches} />
      ) : (
        <TodaTable todas={matches} />
      )}
    </div>
  );
}

type TodaFiltersProps = {
  filter: TodaFilter;
  onChange: (filter: TodaFilter) => void;
  barangays: string[];
  searchRef: RefObject<HTMLInputElement | null>;
};

function TodaFilters({ filter, onChange, barangays, searchRef }: TodaFiltersProps) {
  const { dict } = useDictionary();
  const searchId = useId();
  const barangayId = useId();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Label htmlFor={searchId} className="sr-only">
            {dict.toda.searchLabel}
          </Label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={searchRef}
            id={searchId}
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            value={filter.query}
            onChange={(event) => onChange({ ...filter, query: event.target.value })}
            placeholder={dict.toda.searchLabel}
            className="h-11 pl-9"
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:w-60">
          <Label htmlFor={barangayId}>{dict.toda.barangayFilter}</Label>
          <NativeSelect
            id={barangayId}
            value={filter.barangay}
            onChange={(event) => onChange({ ...filter, barangay: event.target.value })}
            className="w-full [&_select]:h-11"
          >
            <NativeSelectOption value="">{dict.toda.allBarangays}</NativeSelectOption>
            {barangays.map((barangay) => (
              <NativeSelectOption key={barangay} value={barangay}>
                {barangay}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div role="group" aria-label={dict.toda.quickFilters} className="flex flex-wrap gap-2">
        <Toggle
          variant="outline"
          pressed={filter.hasContact}
          onPressedChange={(hasContact) => onChange({ ...filter, hasContact })}
          className="h-11 px-3 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          <Phone aria-hidden="true" />
          {dict.toda.hasContact}
        </Toggle>
        <Toggle
          variant="outline"
          pressed={filter.hasPin}
          onPressedChange={(hasPin) => onChange({ ...filter, hasPin })}
          className="h-11 px-3 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          <MapPin aria-hidden="true" />
          {dict.toda.hasPin}
        </Toggle>
      </div>
    </div>
  );
}

/** Cards read well on a phone; the table lines TODAs up for comparing on a wider screen. */
function ViewToggle({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  const { dict } = useDictionary();

  return (
    <ToggleGroup
      aria-label={dict.toda.view}
      variant="outline"
      spacing={0}
      value={[view]}
      onValueChange={(next) => {
        // Tapping the chosen view again would empty the group, so it is ignored.
        if (next[0] === "cards" || next[0] === "table") onChange(next[0]);
      }}
    >
      <ToggleGroupItem value="cards" className="h-11 px-3 aria-pressed:bg-primary aria-pressed:text-primary-foreground">
        <LayoutGrid aria-hidden="true" />
        {dict.toda.viewCards}
      </ToggleGroupItem>
      <ToggleGroupItem value="table" className="h-11 px-3 aria-pressed:bg-primary aria-pressed:text-primary-foreground">
        <Table2 aria-hidden="true" />
        {dict.toda.viewTable}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
