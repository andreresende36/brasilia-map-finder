import type { ScrapingResult } from "@/types/property";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function scrapeProperties(url: string): Promise<ScrapingResult> {
  try {
    const response = await fetch(`${API_URL}/api/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
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
