import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { type Browser } from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

// Use stealth plugin to avoid Cloudflare detection
puppeteer.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

interface ScrapingResult {
  success: boolean;
  properties: Property[];
  total: number;
  errors: string[];
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from dist (frontend build)
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  app.use(express.static(path.join(__dirname, "../dist")));
}

// Browser instance (singleton)
let browser: Browser | null = null;

// Initialize browser
async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
    });
  }
  return browser;
}

// Fetch HTML using Puppeteer
async function fetchWithPuppeteer(url: string): Promise<string> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to URL (using 'load' - waits for HTML, CSS, images, and scripts to load)
    await page.goto(url, {
      waitUntil: 'load',
      timeout: 20000,
    });
    
    // Wait a bit for scripts to execute (reduced from 2000ms to 1000ms)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get HTML content
    const html = await page.content();
    
    return html;
  } finally {
    await page.close();
  }
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
async function parsePropertyPage(html: string, url: string): Promise<Property | null> {
  const $ = cheerio.load(html);

  // Extract coordinates from script tags
  // DFImóveis uses: latitude = -15.xxx; longitude = -47.xxx;
  let latitude = 0;
  let longitude = 0;
  
  $("script").each((_, el) => {
    const content = $(el).html() || "";
    
    // Pattern: latitude = -15.8705378; longitude = -47.9686399;
    const latMatch = content.match(/latitude\s*=\s*([-\d.]+)\s*;/i);
    const lngMatch = content.match(/longitude\s*=\s*([-\d.]+)\s*;/i);
    
    if (latMatch && lngMatch) {
      latitude = parseFloat(latMatch[1]);
      longitude = parseFloat(lngMatch[1]);
      return false; // Break out of loop
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

// API endpoint for scraping
app.post("/api/scrape", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !url.includes("dfimoveis.com.br")) {
      return res.status(400).json({
        success: false,
        properties: [],
        total: 0,
        errors: ["URL inválida. Use uma URL do DFImóveis."],
      });
    }

    console.log("Fetching listing page:", url);

    // Fetch the listing page using Puppeteer
    let listingHtml: string;
    try {
      listingHtml = await fetchWithPuppeteer(url);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao acessar a página";
      console.error("Error fetching page:", errorMsg);
      throw new Error(`Falha ao acessar a página: ${errorMsg}`);
    }

    const propertyLinks = parseListingPage(listingHtml, url);

    console.log(`Found ${propertyLinks.length} property links`);

    if (propertyLinks.length === 0) {
      return res.json({
        success: false,
        properties: [],
        total: 0,
        errors: ["Nenhum imóvel encontrado nesta listagem."],
      });
    }

    const properties: Property[] = [];
    const errors: string[] = [];

    // Fetch each property page (with concurrency limit)
    const batchSize = 50; // Increased batch size for better performance
    
    for (let i = 0; i < propertyLinks.length; i += batchSize) {
      const batch = propertyLinks.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (link) => {
          try {
            let html: string;
            try {
              html = await fetchWithPuppeteer(link);
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
              throw new Error(`HTTP Error: ${errorMsg}`);
            }
            
            const property = await parsePropertyPage(html, link);
            
            if (property) {
              return property;
            } else {              
              const errorMsg = `${link}: Sem coordenadas válidas`;
              errors.push(errorMsg);
              console.warn(`⚠️  ${errorMsg}`);
              return null;
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
            const fullError = `${link}: ${errorMsg}`;
            errors.push(fullError);
            console.error(`❌ ${fullError}`);
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
    
    if (errors.length > 0) {
      console.log(`\n⚠️  ${errors.length} propriedade(s) falharam:`);
      errors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    res.json({
      success: true,
      properties,
      total: properties.length,
      errors: errors.slice(0, 10), // Limit error messages
    });
  } catch (err) {
    console.error("Scraping error:", err);
    const errorMsg = err instanceof Error ? err.message : "Erro ao buscar imóveis";
    
    res.status(500).json({
      success: false,
      properties: [],
      total: 0,
      errors: [errorMsg],
    });
  }
});

// Serve frontend in production
if (isProduction) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de scraping rodando em http://localhost:${PORT}`);
  if (isProduction) {
    console.log(`📦 Modo produção: servindo frontend estático`);
  }
});
