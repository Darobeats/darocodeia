/** Single source of truth for the sales/support WhatsApp contact. */
export const WHATSAPP_NUMBER = "573204963384";
export const WHATSAPP_DISPLAY = "+57 320 496 3384";

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message.slice(0, 900))}`;
}

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hola, quiero solicitar acceso a DaroCode.";
