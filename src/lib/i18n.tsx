"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

export type Lang = "en" | "bn";

const STORAGE_KEY = "shenjar-lang";

type Listener = () => void;
const listeners = new Set<Listener>();

function readStored(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "bn") return stored;
  } catch {
    // ignore (private browsing, etc.)
  }
  return "en";
}

// Evaluated once when this client module loads in the browser — not inside a
// component or effect, so there's nothing here for React to warn about. On
// the server this stays "en"; useSyncExternalStore's getServerSnapshot below
// keeps hydration consistent, then corrects to the real stored value.
let currentLang: Lang = readStored();

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Lang {
  return currentLang;
}

function getServerSnapshot(): Lang {
  return "en";
}

function setLangGlobal(next: Lang) {
  currentLang = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }
  listeners.forEach((listener) => listener());
}

const LanguageContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return <LanguageContext.Provider value={{ lang, setLang: setLangGlobal }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Picks the Bangla string only when selected and actually present; falls back to English otherwise. */
export function pickLocalized(
  en: string | null | undefined,
  bn: string | null | undefined,
  lang: Lang
): string {
  if (lang === "bn" && bn && bn.trim()) return bn;
  return en?.trim() || "";
}
