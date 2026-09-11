import { en, rw, type MessageKey } from "./messages";

export const LOCALE_COOKIE = "tygamart_locale";
export const LOCALES = ["en", "rw"] as const;
export type Locale = (typeof LOCALES)[number];
export type Vars = Record<string, string | number>;
export type Translator = (key: MessageKey, vars?: Vars) => string;

const dictionaries: Record<Locale, Record<MessageKey, string>> = {
  en,
  rw,
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "rw";
}

export function htmlLang(locale: Locale): string {
  return locale === "rw" ? "rw" : "en";
}

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Vars,
): string {
  const dict = dictionaries[locale] ?? dictionaries.en;
  let text = dict[key] ?? dictionaries.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
