import { cartOptionsLabel } from "@/lib/variant-options";
import { formatPrice, lineTotal } from "@/lib/pricing";
import { translate, type Locale, type MessageKey, type Vars } from "@/i18n";
import type { CartItem } from "@/types/database";

/** Customer WhatsApp (Rwanda local format) */
export const WHATSAPP_DISPLAY = "0783559238";

/** Digits for wa.me links — Rwanda +250, drop leading 0 */
export const WHATSAPP_WA_ME = "250783559238";

/** Physical shop address */
export const STORE_ADDRESS = "Mu Mujyi, Quartier Matheus, KN 72 St, TygaStyle";

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_WA_ME}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

export function mapsUrl(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_ADDRESS)}`;
}

export type OrderWhatsAppDetails = {
  orderNumber: string;
  customerName: string;
  phone: string;
  address?: string;
  notes?: string;
  items: CartItem[];
  total: number;
  summaryUrl?: string;
};

/** Pre-filled WhatsApp message for a placed order (customer sends to the shop). */
export function buildOrderWhatsAppMessage(
  details: OrderWhatsAppDetails,
  locale: Locale = "en",
): string {
  const t = (key: MessageKey, vars?: Vars) => translate(locale, key, vars);

  const lines: string[] = [
    t("wa.orderHello", { ref: details.orderNumber }),
    "",
    t("wa.name", { name: details.customerName.trim() }),
    t("wa.phone", { phone: details.phone.trim() }),
  ];

  if (details.address?.trim()) {
    lines.push(t("wa.address", { address: details.address.trim() }));
  }
  if (details.notes?.trim()) {
    lines.push(t("wa.notes", { notes: details.notes.trim() }));
  }

  lines.push("", t("wa.ordered"));
  for (const item of details.items) {
    const amount = formatPrice(lineTotal(item.unitPrice, item.quantity));
    const opts = cartOptionsLabel(item);
    lines.push(
      opts
        ? `• ${item.name} (${opts}) ×${item.quantity} — ${amount}`
        : `• ${item.name} ×${item.quantity} — ${amount}`,
    );
  }

  lines.push("", t("wa.total", { total: formatPrice(details.total) }));

  if (details.summaryUrl?.trim()) {
    lines.push("", t("wa.details"), details.summaryUrl.trim());
  }

  lines.push("", t("wa.thanks"));
  return lines.join("\n");
}
