import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

export type CountryDial = {
  code: CountryCode;
  name: string;
  dial: string;
  flag: string;
};

function flagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0)),
    );
}

/** Priority countries pinned to the top of the picker. */
const PRIORITY_CODES: CountryCode[] = [
  "RW",
  "UG",
  "KE",
  "TZ",
  "BI",
  "CD",
];

function buildCountryList(): CountryDial[] {
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = getCountries().map((code) => ({
    code,
    name: regionNames.of(code) ?? code,
    dial: getCountryCallingCode(code),
    flag: flagEmoji(code),
  }));

  const priority = new Set(PRIORITY_CODES);
  const top = PRIORITY_CODES.map(
    (code) => countries.find((c) => c.code === code)!,
  ).filter(Boolean);
  const rest = countries
    .filter((c) => !priority.has(c.code))
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...top, ...rest];
}

export const COUNTRY_DIALS: CountryDial[] = buildCountryList();

export const DEFAULT_COUNTRY =
  COUNTRY_DIALS.find((c) => c.code === "RW") ?? COUNTRY_DIALS[0];

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Build E.164 number for a country + national digits.
 * Accepts local formats with a leading 0.
 */
export function formatInternationalPhone(
  country: CountryCode,
  nationalNumber: string,
): string | null {
  const digits = digitsOnly(nationalNumber);
  if (!digits) return null;

  const parsed = parsePhoneNumberFromString(digits, country);
  if (parsed?.isValid()) {
    return parsed.format("E.164");
  }

  // Fallback attempt with explicit +dial if parse of national failed
  const dial = getCountryCallingCode(country);
  let national = digits;
  if (national.startsWith("0")) {
    national = national.slice(1);
  }
  const candidate = `+${dial}${national}`;
  if (isValidPhoneNumber(candidate)) {
    return parsePhoneNumberFromString(candidate)?.format("E.164") ?? candidate;
  }

  return null;
}

export function isValidPhoneForCountry(
  country: CountryCode,
  nationalNumber: string,
): boolean {
  return formatInternationalPhone(country, nationalNumber) != null;
}

export function isValidE164Phone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) return false;
  return isValidPhoneNumber(trimmed);
}

