"use client";

import { XIcon } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { PinBadge } from "@/components/fare/pin-badge";
import type { Place, PointKey } from "@/components/fare/types";
import { useDictionary } from "@/components/shared/dictionary-provider";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import type { Landmark } from "@/lib/data";
import { fill } from "@/lib/i18n/locales";
import { searchPlaces } from "@/lib/map-services";
import { cn } from "@/lib/utils";

const RECENT_KEY = "pamasahe:recent-places";
const MAX_RECENT = 5;
const MAX_LANDMARKS = 6;
const MIN_REMOTE_QUERY = 3;
const SEARCH_DELAY_MS = 400;

type PointSearchProps = {
  id: string;
  label: string;
  pin: PointKey;
  value?: Place;
  landmarks: Landmark[];
  active: boolean;
  onActivate: () => void;
  onSelect: (place: Place) => void;
  onClear: () => void;
  /** Extra control shown on the label row, e.g. "Use my location". */
  labelAction?: ReactNode;
};

type RemoteResults = { query: string; places: Place[]; failed: boolean };
type Group = { key: string; title: string; places: Place[] };

function isPlace(value: unknown): value is Place {
  if (typeof value !== "object" || value === null) return false;
  const { position, label } = value as Record<string, unknown>;
  return (
    Array.isArray(position) &&
    position.length === 2 &&
    position.every((n) => typeof n === "number") &&
    typeof label === "string"
  );
}

// Storage can be missing, full or blocked (private mode), so every access is guarded.
function readRecent(): Place[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isPlace).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(place: Place): void {
  try {
    const samePlace = (other: Place) =>
      other.label === place.label &&
      other.position[0] === place.position[0] &&
      other.position[1] === place.position[1];
    const next = [place, ...readRecent().filter((other) => !samePlace(other))].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Recent places are a convenience; losing them is fine.
  }
}

export const landmarkToPlace = (landmark: Landmark): Place => ({
  position: landmark.position,
  label: landmark.name,
  detail: landmark.area,
});

export function PointSearch({
  id,
  label,
  pin,
  value,
  landmarks,
  active,
  onActivate,
  onSelect,
  onClear,
  labelAction,
}: PointSearchProps) {
  const { dict } = useDictionary();
  const inputRef = useRef<HTMLInputElement>(null);
  // Text the user is typing; null means the input shows the chosen place.
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [recent, setRecent] = useState<Place[]>([]);
  const [remote, setRemote] = useState<RemoteResults>({ query: "", places: [], failed: false });

  // A place set from elsewhere (map tap, swap) replaces whatever was being typed.
  const [shownValue, setShownValue] = useState(value);
  if (value !== shownValue) {
    setShownValue(value);
    setDraft(null);
  }

  const query = (draft ?? "").trim();
  const remoteQuery = open && query.length >= MIN_REMOTE_QUERY ? query : "";

  useEffect(() => {
    if (!remoteQuery) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchPlaces(remoteQuery, controller.signal)
        .then((places) => setRemote({ query: remoteQuery, places, failed: false }))
        .catch(() => {
          if (!controller.signal.aborted) setRemote({ query: remoteQuery, places: [], failed: true });
        });
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [remoteQuery]);

  const needle = query.toLowerCase();
  const matchingLandmarks = landmarks
    .filter(
      (landmark) =>
        landmark.name.toLowerCase().includes(needle) || landmark.area.toLowerCase().includes(needle),
    )
    .slice(0, MAX_LANDMARKS)
    .map(landmarkToPlace);
  const remoteReady = remoteQuery !== "" && remote.query === remoteQuery;
  const searching = remoteQuery !== "" && !remoteReady;
  const searchFailed = remoteReady && remote.failed;

  const groups: Group[] = [
    { key: "landmarks", title: dict.search.landmarks, places: matchingLandmarks },
    { key: "recent", title: dict.search.recent, places: query ? [] : recent },
    { key: "search", title: dict.search.results, places: remoteReady ? remote.places : [] },
  ].filter((group) => group.places.length > 0);
  const options = groups.flatMap((group) => group.places);
  const activeIndex = highlighted < options.length ? highlighted : -1;

  const listboxId = `${id}-listbox`;
  const hintId = `${id}-hint`;
  const optionId = (index: number) => `${id}-option-${index}`;
  const expanded = open && (options.length > 0 || query.length > 0);

  const select = (place: Place) => {
    saveRecent(place);
    setDraft(null);
    setOpen(false);
    setHighlighted(-1);
    onSelect(place);
  };

  const close = () => {
    setOpen(false);
    setDraft(null);
    setHighlighted(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (options.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setHighlighted((activeIndex + step + options.length) % options.length);
    } else if (event.key === "Enter" && expanded) {
      const place = options[activeIndex] ?? options[0];
      if (!place) return;
      event.preventDefault();
      select(place);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    }
  };

  const renderedGroups = groups.map((group) => ({
    ...group,
    startIndex: options.indexOf(group.places[0]),
  }));

  return (
    <div className="relative grid gap-1.5">
      <div className="flex min-h-8 items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {labelAction}
      </div>
      <InputGroup
        data-active={active || undefined}
        className={cn("h-11 bg-background", active && "border-primary ring-2 ring-primary")}
      >
        <InputGroupAddon align="inline-start">
          <PinBadge pin={pin} />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          placeholder={dict.search.placeholder}
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listboxId}
          aria-activedescendant={expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-describedby={active ? hintId : undefined}
          value={draft ?? value?.label ?? ""}
          onChange={(event) => {
            setDraft(event.target.value);
            setOpen(true);
            setHighlighted(-1);
          }}
          onFocus={() => {
            setRecent(readRecent());
            setOpen(true);
            onActivate();
          }}
          onBlur={close}
          onKeyDown={handleKeyDown}
        />
        {value && (
          <InputGroupAddon align="inline-end" className="pr-0">
            <InputGroupButton
              size="icon-sm"
              className="size-11"
              aria-label={fill(dict.search.clear, { label })}
              onClick={() => {
                close();
                onClear();
                inputRef.current?.focus();
              }}
            >
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
      {active && (
        <span id={hintId} className="sr-only">
          {dict.search.editingHint}
        </span>
      )}

      <div
        hidden={!expanded}
        className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      >
        <div id={listboxId} role="listbox" aria-label={fill(dict.search.suggestions, { label })}>
          {renderedGroups.map((group) => (
            <div key={group.key} role="group" aria-labelledby={`${id}-${group.key}`}>
              <div
                id={`${id}-${group.key}`}
                role="presentation"
                className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground"
              >
                {group.title}
              </div>
              {group.places.map((place, offset) => {
                const index = group.startIndex + offset;
                return (
                  <div
                    key={optionId(index)}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === activeIndex}
                    // Keep focus in the input so blur doesn't close the list before the click lands.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(place)}
                    onMouseMove={() => index !== activeIndex && setHighlighted(index)}
                    className="flex min-h-11 cursor-pointer flex-col justify-center rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <span className="font-medium">{place.label}</span>
                    {place.detail && (
                      <span className="text-xs text-muted-foreground">{place.detail}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {searching && (
          <p className="px-2 py-2 text-sm text-muted-foreground" role="status">
            {dict.search.searching}
          </p>
        )}
        {searchFailed && (
          <p className="px-2 py-2 text-sm text-muted-foreground" role="status">
            {dict.search.searchFailed}
          </p>
        )}
        {!searching && !searchFailed && options.length === 0 && (
          <p className="px-2 py-2 text-sm text-muted-foreground" role="status">
            {dict.search.noResults}
          </p>
        )}
      </div>
    </div>
  );
}
