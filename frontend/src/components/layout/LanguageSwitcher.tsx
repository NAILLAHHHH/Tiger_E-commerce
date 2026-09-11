"use client";

import { useT } from "@/i18n/LocaleProvider";
import type { Locale } from "@/i18n";

export default function LanguageSwitcher({
  className = "",
}: {
  className?: string;
}) {
  const { locale, t, setLocale } = useT();

  return (
    <div
      role="group"
      aria-label={t("lang.label")}
      className={`inline-flex shrink-0 overflow-hidden rounded-[5px] border border-gray-3 text-[11px] font-semibold ${className}`}
    >
      <LangButton
        active={locale === "en"}
        label={t("lang.en")}
        onClick={() => setLocale("en")}
        locale="en"
      />
      <LangButton
        active={locale === "rw"}
        label={t("lang.rw")}
        onClick={() => setLocale("rw")}
        locale="rw"
      />
    </div>
  );
}

function LangButton({
  active,
  label,
  onClick,
  locale,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  locale: Locale;
}) {
  return (
    <button
      type="button"
      lang={locale}
      aria-pressed={active}
      onClick={onClick}
      className={`px-2.5 py-2 transition-colors ${
        active
          ? "bg-brand text-white"
          : "bg-surface text-body hover:text-brand"
      }`}
    >
      {label}
    </button>
  );
}
