import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Property {
  id: string;
  title: string;
  price: string;
  priceValue: number;
  image: string;
  link: string;
  latitude: number;
  longitude: number;
}

// Extract price value from string
function extractPriceValue(priceStr: string): number {
  const cleaned = priceStr.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

// Parse listing page to get property links
function parseListingPage(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];

  // DFImóveis uses various selectors for property cards
  $('a[href*="/imovel/"], a[href*="/aluguel/"], a[href*="/venda/"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href && (href.includes("/imovel/") || href.match(/\/\d+-/))) {
      const fullUrl = href.startsWith("http") ? href : `https://www.dfimoveis.com.br${href}`;
      if (!links.includes(fullUrl) && fullUrl.includes("dfimoveis.com.br")) {
        links.push(fullUrl);
      }
    }
  });

  // Also try card-based selectors
  $(".card-imovel a, .imovel-card a, [data-imovel] a, .property-card a").each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      const fullUrl = href.startsWith("http") ? href : `https://www.dfimoveis.com.br${href}`;
      if (!links.includes(fullUrl) && fullUrl.includes("dfimoveis.com.br")) {
        links.push(fullUrl);
      }
    }
  });

  return [...new Set(links)].slice(0, 30); // Limit to 30 properties for performance
}

// Parse individual property page
function parsePropertyPage(html: string, url: string): Property | null {
  const $ = cheerio.load(html);

  // Extract coordinates from script tags
  let latitude = 0;
  let longitude = 0;

  // Look for google maps embed or data attributes
  $("script").each((_, el) => {
    const content = $(el).html() || "";
    
    // Pattern: new google.maps.LatLng(-15.xxx, -47.xxx)
    const latLngMatch = content.match(/LatLng\s*\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
    if (latLngMatch) {
      latitude = parseFloat(latLngMatch[1]);
      longitude = parseFloat(latLngMatch[2]);
    }

    // Pattern: lat: -15.xxx, lng: -47.xxx
    const latMatch = content.match(/lat[itude]*["'\s:]+\s*([-\d.]+)/i);
    const lngMatch = content.match(/lng|longitude["'\s:]+\s*([-\d.]+)/i);
    if (latMatch && lngMatch && !latitude) {
      latitude = parseFloat(latMatch[1]);
      longitude = parseFloat(lngMatch[1]);
    }

    // Pattern: coordinates in JSON
    const coordMatch = content.match(/"latitude":\s*([-\d.]+).*?"longitude":\s*([-\d.]+)/);
    if (coordMatch && !latitude) {
      latitude = parseFloat(coordMatch[1]);
      longitude = parseFloat(coordMatch[2]);
    }
  });

  // Also check meta tags and data attributes
  const latAttr = $('[data-lat], [data-latitude]').first().data('lat') || $('[data-lat], [data-latitude]').first().data('latitude');
  const lngAttr = $('[data-lng], [data-longitude]').first().data('lng') || $('[data-lng], [data-longitude]').first().data('longitude');
  if (latAttr && lngAttr && !latitude) {
    latitude = parseFloat(String(latAttr));
    longitude = parseFloat(String(lngAttr));
  }

  // Check iframe src for coordinates
  $('iframe[src*="maps"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const match = src.match(/q=([-\d.]+),([-\d.]+)/);
    if (match && !latitude) {
      latitude = parseFloat(match[1]);
      longitude = parseFloat(match[2]);
    }
  });

  // Skip if no valid coordinates
  if (!latitude || !longitude || latitude === 0 || longitude === 0) {
    return null;
  }

  // Extract title
  const title = $("h1").first().text().trim() ||
    $(".titulo-imovel, .property-title, [class*='title']").first().text().trim() ||
    $("title").text().split("|")[0].trim() ||
    "Imóvel";

  // Extract price
  let price = "";
  $(".valor, .preco, .price, [class*='price'], [class*='valor']").each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes("R$") && !price) {
      price = text;
    }
  });
  
  if (!price) {
    const bodyText = $("body").text();
    const priceMatch = bodyText.match(/R\$\s*[\d.,]+/);
    if (priceMatch) {
      price = priceMatch[0];
    }
  }

  price = price || "Consulte";
  const priceValue = extractPriceValue(price);

  // Extract main image
  let image = "";
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    if (src && !image && (src.includes("imovel") || src.includes("foto") || src.includes("image"))) {
      image = src.startsWith("http") ? src : `https://www.dfimoveis.com.br${src}`;
    }
  });

  // Fallback to first substantial image
  if (!image) {
    $("img[src*='.jpg'], img[src*='.jpeg'], img[src*='.png'], img[src*='.webp']").each((_, el) => {
      const src = $(el).attr("src") || "";
      if (src && !image && !src.includes("logo") && !src.includes("icon")) {
        image = src.startsWith("http") ? src : `https://www.dfimoveis.com.br${src}`;
      }
    });
  }

  // OG image as last fallback
  if (!image) {
    image = $('meta[property="og:image"]').attr("content") || "/placeholder.svg";
  }

  return {
    id: url.split("/").pop() || Math.random().toString(36).substr(2, 9),
    title: title.substring(0, 200),
    price,
    priceValue,
    image,
    link: url,
    latitude,
    longitude,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || !url.includes("dfimoveis.com.br")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "URL inválida. Use uma URL do DFImóveis.",
          properties: [],
          total: 0,
          errors: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching listing page:", url);

    // Fetch the listing page
    const listingResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });

    if (!listingResponse.ok) {
      throw new Error(`Falha ao acessar a página: ${listingResponse.status}`);
    }

    const listingHtml = await listingResponse.text();
    const propertyLinks = parseListingPage(listingHtml, url);

    console.log(`Found ${propertyLinks.length} property links`);

    if (propertyLinks.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nenhum imóvel encontrado nesta listagem.",
          properties: [],
          total: 0,
          errors: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const properties: Property[] = [];
    const errors: (object|string)[] = [];

    // Fetch each property page (with concurrency limit)
    const batchSize = 5;
    
    for (let i = 0; i < propertyLinks.length; i += batchSize) {
      const batch = propertyLinks.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (link) => {
          try {
            const response = await fetch(link, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml",
              },
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();
            
            const property = parsePropertyPage(html, link);
            
            if (property) {
              return property;
            } else {
              errors.push({ link , html});
              return null;
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
            errors.push(`${link}: ${errorMsg}`);
            return null;
          }
        })
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled" && result.value) {
          properties.push(result.value);
        }
      }
    }

    console.log(`Successfully scraped ${properties.length} properties`);

    return new Response(
      JSON.stringify({
        success: true,
        properties,
        total: properties.length,
        errors: errors.slice(0, 10), // Limit error messages
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Scraping error:", err);
    const errorMsg = err instanceof Error ? err.message : "Erro ao buscar imóveis";
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMsg,
        properties: [],
        total: 0,
        errors: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
