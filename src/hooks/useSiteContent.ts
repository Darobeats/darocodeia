import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { SITE_FIELDS } from "@/data/siteContentSchema";

export interface SiteContentRow {
  id: string;
  key: string;
  type: string;
  section: string;
  label: string | null;
  value_es: string | null;
  value_en: string | null;
  draft_es: string | null;
  draft_en: string | null;
  published_at: string | null;
  updated_at: string | null;
}

export type SiteContentMode = "published" | "draft";

async function fetchSiteContent(): Promise<SiteContentRow[]> {
  const { data, error } = await supabase.from("site_content").select("*");
  if (error) throw error;
  return (data || []) as SiteContentRow[];
}

export function useSiteContentRows() {
  return useQuery({
    queryKey: ["site_content"],
    queryFn: fetchSiteContent,
    staleTime: 60_000,
  });
}

/** True when the site should render draft content (preview mode). */
export function useDraftPreview(): boolean {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("preview") === "draft";
  }, []);
}

/**
 * Returns a translator that prefers the site content saved by the super admin
 * and falls back to the built-in translations.
 */
export function useSiteText() {
  const { t, locale } = useLanguage();
  const { data: rows } = useSiteContentRows();
  const draftMode = useDraftPreview();

  const map = useMemo(() => {
    const result: Record<string, string> = {};
    (rows || []).forEach((row) => {
      const published = locale === "en" ? row.value_en : row.value_es;
      const draft = locale === "en" ? row.draft_en : row.draft_es;
      const value = draftMode ? draft ?? published : row.published_at ? published : null;
      if (value && value.trim()) result[row.key] = value.trim();
    });
    return result;
  }, [rows, locale, draftMode]);

  return useCallback(
    (key: string, fallback?: string): string => {
      const override = map[key];
      if (override) return override;
      if (fallback !== undefined) return fallback;
      const field = SITE_FIELDS.find((f) => f.key === key);
      if (field?.i18nKey) return t(field.i18nKey);
      if (field) return (locale === "en" ? field.defaultEn : field.defaultEs) ?? t(key);
      return t(key);
    },
    [map, t, locale]
  );
}
