import type { ScrapingResult } from "@/types/property";

function getApiRoot(): string {
  // 1) Prefer Vite build-time env (se você setar VITE_API_URL explicitamente)
  const fromVite = (import.meta.env.VITE_API_URL || "").trim();
  // 2) Runtime config (Railway Variables via /config.js), usando DOMAIN_URL → apiBaseUrl
  const fromRuntime = (typeof window !== "undefined" ? window.__APP_CONFIG__?.apiBaseUrl : "")?.trim() || "";
  // 3) Fallback: mesma origem (quando frontend e backend estão no mesmo serviço).
  // Em dev (Vite em localhost:5173), isso apontaria para o lugar errado, então evitamos.
  const fromLocation =
    typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
      ? window.location.origin
      : "";

  const base = fromVite || fromRuntime || fromLocation || "http://localhost:3001";
  const normalized = base.replace(/\/$/, "");

  // Permite que a base já venha com "/api" (ex.: https://.../api)
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
}

export async function scrapeProperties(url: string): Promise<ScrapingResult> {
  try {
    const apiRoot = getApiRoot();
    const response = await fetch(`${apiRoot}/scrape`, {
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
