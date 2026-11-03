import { useEffect, useSyncExternalStore } from "react";

/** Az oldal kizárólag magyar nyelvű. */
export type Lang = "hu" | "ro";
export const LANGS: Lang[] = ["hu"];

export function initDomainLang(_l: Lang | null) {}
export function setLang(_l: Lang) {}

/** Igaz hidratálás után: ekkor az időket a látogató saját időzónájában írjuk ki. */
export let localTz = false;

export function useLang(): Lang {
  localTz = useSyncExternalStore(() => () => {}, () => true, () => false);
  useEffect(() => {
    document.documentElement.lang = "hu";
  }, []);
  return "hu";
}
