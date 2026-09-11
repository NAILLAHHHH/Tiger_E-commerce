import { cookies } from "next/headers";
import {
  LOCALE_COOKIE,
  isLocale,
  translate,
  type Locale,
  type Translator,
} from "@/i18n";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : "en";
}

export async function getTranslator(): Promise<{
  locale: Locale;
  t: Translator;
}> {
  const locale = await getLocale();
  return {
    locale,
    t: (key, vars) => translate(locale, key, vars),
  };
}
