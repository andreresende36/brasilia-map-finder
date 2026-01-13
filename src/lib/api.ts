import { supabase } from "@/integrations/supabase/client";
import type { ScrapingResult } from "@/types/property";

export async function scrapeProperties(url: string): Promise<ScrapingResult> {
  try {
    const { data, error } = await supabase.functions.invoke("scrape-dfimoveis", {
      body: { url },
    });

    if (error) {
      console.error("Supabase function error:", error);
      return {
        success: false,
        properties: [],
        total: 0,
        errors: [error.message || "Erro ao conectar com o servidor de scraping"],
      };
    }

    return data as ScrapingResult;
  } catch (error) {
    console.error("API error:", error);
    return {
      success: false,
      properties: [],
      total: 0,
      errors: [(error as Error).message || "Erro ao conectar com o servidor de scraping"],
    };
  }
}
