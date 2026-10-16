"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";

type DictionaryContextValue = { locale: Locale; dict: Dictionary };

const DictionaryContext = createContext<DictionaryContextValue | null>(null);

/** Hands the server-chosen dictionary to Client Components. */
export function DictionaryProvider({ children, ...value }: DictionaryContextValue & { children: ReactNode }) {
  return <DictionaryContext value={value}>{children}</DictionaryContext>;
}

export function useDictionary(): DictionaryContextValue {
  const value = useContext(DictionaryContext);
  if (!value) throw new Error("useDictionary must be used inside DictionaryProvider");
  return value;
}
