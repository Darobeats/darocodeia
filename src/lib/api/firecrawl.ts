import { supabase } from '@/integrations/supabase/client';

export interface ScrapedWebsite {
  url: string;
  markdown: string;
  html: string;
  screenshot: string | null;
  links: string[];
  branding: {
    colorScheme?: string;
    logo?: string;
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
      textPrimary?: string;
      textSecondary?: string;
    };
    fonts?: Array<{ family: string }>;
    typography?: {
      fontFamilies?: {
        primary?: string;
        heading?: string;
        code?: string;
      };
      fontSizes?: Record<string, string>;
      fontWeights?: Record<string, number>;
    };
    spacing?: {
      baseUnit?: number;
      borderRadius?: string;
    };
    components?: Record<string, unknown>;
    images?: {
      logo?: string;
      favicon?: string;
      ogImage?: string;
    };
  } | null;
  metadata: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
    statusCode?: number;
  };
}

export interface ScrapeResponse {
  success: boolean;
  error?: string;
  data?: ScrapedWebsite;
}

export const firecrawlApi = {
  async scrapeForDuplication(url: string): Promise<ScrapeResponse> {
    const { data, error } = await supabase.functions.invoke('scrape-website', {
      body: { 
        url, 
        options: {
          formats: ['markdown', 'screenshot', 'branding', 'html', 'links'],
          onlyMainContent: false,
          waitFor: 2000,
        }
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    
    return data;
  },

  // Format branding info for AI prompt
  formatBrandingForPrompt(branding: ScrapedWebsite['branding']): string {
    if (!branding) return '';

    const lines: string[] = [];
    
    if (branding.colorScheme) {
      lines.push(`Color Scheme: ${branding.colorScheme}`);
    }
    
    if (branding.colors) {
      lines.push('\nColors detected:');
      Object.entries(branding.colors).forEach(([key, value]) => {
        if (value) lines.push(`  - ${key}: ${value}`);
      });
    }
    
    if (branding.fonts && branding.fonts.length > 0) {
      lines.push(`\nFonts: ${branding.fonts.map(f => f.family).join(', ')}`);
    }
    
    if (branding.typography?.fontFamilies) {
      lines.push('\nTypography:');
      Object.entries(branding.typography.fontFamilies).forEach(([key, value]) => {
        if (value) lines.push(`  - ${key}: ${value}`);
      });
    }
    
    if (branding.spacing) {
      lines.push(`\nSpacing: base unit ${branding.spacing.baseUnit}px, border-radius ${branding.spacing.borderRadius}`);
    }

    return lines.join('\n');
  },

  // Check if text contains a URL
  detectUrl(text: string): string | null {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches ? matches[0] : null;
  },
};
