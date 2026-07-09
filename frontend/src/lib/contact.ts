/** Customer WhatsApp (Rwanda local format) */
export const WHATSAPP_DISPLAY = "0783559238";

/** Digits for wa.me links — Rwanda +250, drop leading 0 */
export const WHATSAPP_WA_ME = "250783559238";

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_WA_ME}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}
