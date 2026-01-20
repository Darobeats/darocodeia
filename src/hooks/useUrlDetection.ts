import { useState, useCallback } from "react";
import { firecrawlApi, ScrapedWebsite } from "@/lib/api/firecrawl";
import { toast } from "sonner";

export function useUrlDetection() {
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedWebsite | null>(null);

  const checkForUrl = useCallback((text: string) => {
    const url = firecrawlApi.detectUrl(text);
    
    // Only detect if it looks like the user wants to duplicate
    const duplicationKeywords = [
      "duplica", "replica", "copia", "clona", "imita",
      "duplicate", "replicate", "copy", "clone", "imitate",
      "como", "like", "similar", "based on", "basado en"
    ];
    
    const lowerText = text.toLowerCase();
    const hasDuplicationIntent = duplicationKeywords.some(kw => lowerText.includes(kw));
    
    if (url && hasDuplicationIntent) {
      setDetectedUrl(url);
      return url;
    }
    
    return null;
  }, []);

  const analyzeUrl = useCallback(async (url: string) => {
    setIsAnalyzing(true);
    setScrapedData(null);

    try {
      const result = await firecrawlApi.scrapeForDuplication(url);
      
      if (result.success && result.data) {
        setScrapedData(result.data);
        return result.data;
      } else {
        toast.error(result.error || "Error al analizar la página");
        return null;
      }
    } catch (error) {
      console.error("Error analyzing URL:", error);
      toast.error("Error al conectar con el servicio de análisis");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearUrl = useCallback(() => {
    setDetectedUrl(null);
    setScrapedData(null);
    setIsAnalyzing(false);
  }, []);

  return {
    detectedUrl,
    isAnalyzing,
    scrapedData,
    checkForUrl,
    analyzeUrl,
    clearUrl,
  };
}
