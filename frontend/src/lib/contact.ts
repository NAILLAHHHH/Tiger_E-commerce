import { formatPrice, lineTotal } from "@/lib/pricing";
import type { CartItem } from "@/types/database";

/** Customer WhatsApp (Rwanda local format) */
export const WHATSAPP_DISPLAY = "0784815151";

/** Digits for wa.me links — Rwanda +250, drop leading 0 */
export const WHATSAPP_WA_ME = "250784815151";

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_WA_ME}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
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
export function buildOrderWhatsAppMessage(details: OrderWhatsAppDetails): string {
  const lines: string[] = [
    `Hey! I just made an order ${details.orderNumber}`,
    "",
    `Name: ${details.customerName.trim()}`,
    `Phone: ${details.phone.trim()}`,
  ];

  if (details.address?.trim()) {
    lines.push(`Address: ${details.address.trim()}`);
  }
  if (details.notes?.trim()) {
    lines.push(`Notes: ${details.notes.trim()}`);
  }

  lines.push("", "Here's what I ordered:");
  for (const item of details.items) {
    const amount = formatPrice(lineTotal(item.unitPrice, item.quantity));
    lines.push(
      `• ${item.name} (${item.color}, ${item.size}) ×${item.quantity} — ${amount}`,
    );
  }

  lines.push("", `Total: ${formatPrice(details.total)}`);

  if (details.summaryUrl?.trim()) {
    lines.push("", "Order details:", details.summaryUrl.trim());
  }

  lines.push("", "Thanks!");
  return lines.join("\n");
}
