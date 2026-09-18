import { useCallback } from "react";
import { DEFAULT_WHATSAPP_MESSAGE, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/data/contact";
import { useSiteText } from "@/hooks/useSiteContent";

/** WhatsApp contact that honours the number configured by the super admin. */
export function useWhatsApp() {
  const st = useSiteText();
  const number = (st("contact.whatsappNumber", WHATSAPP_NUMBER) || WHATSAPP_NUMBER).replace(/\D/g, "");
  const display = st("contact.whatsappDisplay", WHATSAPP_DISPLAY);

  const link = useCallback(
    (message: string = DEFAULT_WHATSAPP_MESSAGE) => {
      const base = `https://wa.me/${number || WHATSAPP_NUMBER}`;
      if (!message) return base;
      return `${base}?text=${encodeURIComponent(message.slice(0, 900))}`;
    },
    [number]
  );

  return { number, display, link };
}
