import type { Translator } from "@/i18n";

export function localizeOptionName(name: string, t: Translator): string {
  const key = name.trim().toLowerCase();
  if (key === "color" || key === "colour") return t("option.color");
  if (key === "size") return t("option.size");
  if (key === "pack") return t("option.pack");
  return name;
}
