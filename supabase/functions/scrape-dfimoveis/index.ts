import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Property {
  id: string;
  title: string;
  price: number;
  priceFormatted: string;
  image: string;
  url: string;
  latitude: number;
  longitude: number;
  address?: string;
  area?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
}

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("All retries failed");
}

function extractCoordinates(html: string): { lat: number; lng: number } | null {
  // Try to find coordinates in the HTML
  const latMatch = html.match(/data-lat["\s]*[:=]["'\s]*(-?\d+\.?\d*)/i) ||
                   html.match(/latitude["\s]*[:=]["'\s]*(-?\d+\.?\d*)/i) ||
                   html.match(/"lat"\s*:\s*(-?\d+\.?\d*)/i) ||
                   html.match(/lat:\s*(-?\d+\.?\d*)/i);
  
  const lngMatch = html.match(/data-lng["\s]*[:=]["'\s]*(-?\d+\.?\d*)/i) ||
                   html.match(/longitude["\s]*[:=]["'\s]*(-?\d+\.?\d*)/i) ||
                   html.match(/"lng"\s*:\s*(-?\d+\.?\d*)/i) ||
                   html.match(/lng:\s*(-?\d+\.?\d*)/i);

  if (latMatch && lngMatch) {
    const lat = parseFloat(latMatch[1]);
    const lng = parseFloat(lngMatch[1]);
    
    // Validate coordinates are in Brazil/DF region
    if (lat >= -20 && lat <= -10 && lng >= -50 && lng <= -45) {
      return { lat, lng };
    }
  }
  
  return null;
}

function parsePrice(priceText: string): number {
  const cleaned = priceText.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

async function scrapePropertyDetails(url: string): Promise<Partial<Property> | null> {
  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);
    
    const coordinates = extractCoordinates(html);
    
    if (!coordinates) {
      console.log(`No coordinates found for ${url}`);
      return null;
    }
    
    // Extract additional details from property page
    const address = $(".property-address, .endereco, [class*='address']").first().text().trim();
    
    return {
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      address: address || undefined,
    };
  } catch (error) {
    console.error(`Error scraping property details from ${url}:`, error);
    return null;
  }
}

async function scrapeListingPage(url: string): Promise<{ properties: Property[]; errors: string[] }> {
  const properties: Property[] = [];
  const errors: string[] = [];
  
  try {
    console.log(`Scraping listing page: ${url}`);
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);
    
    // Find property cards - DFImóveis uses various selectors
    const propertyCards = $(".card-imovel, .property-card, [class*='imovel'], .resultado-item, article").toArray();
    
    console.log(`Found ${propertyCards.length} property cards`);
    
    // Process properties in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < propertyCards.length; i += batchSize) {
      const batch = propertyCards.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (card, index) => {
        try {
          const $card = $(card);
          
          // Extract basic info from listing card
          const linkElement = $card.find("a[href*='/imovel/'], a[href*='/aluguel/'], a[href*='/venda/']").first();
          let propertyUrl = linkElement.attr("href") || "";
          
          if (!propertyUrl) {
            // Try to find any link in the card
            propertyUrl = $card.find("a").first().attr("href") || "";
          }
          
          if (!propertyUrl) {
            console.log(`No URL found for card ${i + index}`);
            return null;
          }
          
          // Make URL absolute
          if (propertyUrl.startsWith("/")) {
            propertyUrl = `https://www.dfimoveis.com.br${propertyUrl}`;
          }
          
          // Extract title
          const title = $card.find(".card-title, .titulo, h2, h3, [class*='title']").first().text().trim() ||
                       $card.find("a").first().attr("title") ||
                       "Imóvel";
          
          // Extract price
          const priceText = $card.find(".card-price, .preco, [class*='price'], [class*='valor']").first().text().trim();
          const price = parsePrice(priceText);
          
          // Extract image
          const imageElement = $card.find("img").first();
          let image = imageElement.attr("data-src") || 
                     imageElement.attr("src") || 
                     imageElement.attr("data-lazy") ||
                     "";
          
          if (image && !image.startsWith("http")) {
            image = `https://www.dfimoveis.com.br${image}`;
          }
          
          // Get property details (including coordinates)
          const details = await scrapePropertyDetails(propertyUrl);
          
          if (!details || !details.latitude || !details.longitude) {
            console.log(`Skipping property without coordinates: ${propertyUrl}`);
            return null;
          }
          
          const property: Property = {
            id: `prop-${i + index}-${Date.now()}`,
            title,
            price,
            priceFormatted: price > 0 ? `R$ ${price.toLocaleString("pt-BR")}` : priceText || "Consulte",
            image: image || "/placeholder.svg",
            url: propertyUrl,
            latitude: details.latitude,
            longitude: details.longitude,
            address: details.address,
          };
          
          return property;
        } catch (error) {
          console.error(`Error processing property ${i + index}:`, error);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      properties.push(...batchResults.filter((p): p is Property => p !== null));
      
      // Small delay between batches
      if (i + batchSize < propertyCards.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
  } catch (error) {
    console.error("Error scraping listing page:", error);
    errors.push(`Erro ao acessar a página: ${(error as Error).message}`);
  }
  
  return { properties, errors };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url || !url.includes("dfimoveis.com.br")) {
      return new Response(
        JSON.stringify({
          success: false,
          properties: [],
          total: 0,
          errors: ["URL inválida. Forneça uma URL do DFImóveis."],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting scrape for URL: ${url}`);
    
    const result = await scrapeListingPage(url);
    
    console.log(`Scraping complete. Found ${result.properties.length} properties with coordinates.`);
    
    return new Response(
      JSON.stringify({
        success: result.properties.length > 0,
        properties: result.properties,
        total: result.properties.length,
        errors: result.errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        properties: [],
        total: 0,
        errors: [(error as Error).message || "Erro interno do servidor"],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
