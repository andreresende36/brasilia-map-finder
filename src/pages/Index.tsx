import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { PriceFilter } from "@/components/PriceFilter";
import { PropertyList } from "@/components/PropertyList";
import { PropertyMap } from "@/components/PropertyMap";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { scrapeProperties } from "@/lib/api";
import type { Property } from "@/types/property";
import { toast } from "sonner";

const Index = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | undefined>();
  const [lastUrl, setLastUrl] = useState("");
  
  // Price filter state
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });

  // Calculate price bounds from properties
  const priceBounds = useMemo(() => {
    if (properties.length === 0) return { min: 0, max: 10000 };
    const prices = properties.map(p => p.priceValue).filter(p => p > 0);
    if (prices.length === 0) return { min: 0, max: 10000 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [properties]);

  // Filter properties by price
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      if (priceRange.max === Infinity) return true;
      return p.priceValue >= priceRange.min && p.priceValue <= priceRange.max;
    });
  }, [properties, priceRange]);

  const handleSearch = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedProperty(undefined);
    setLastUrl(url);
    setPriceRange({ min: 0, max: Infinity });

    try {
      const result = await scrapeProperties(url);

      if (result.success && result.properties.length > 0) {
        setProperties(result.properties);
        toast.success(`${result.properties.length} imóveis encontrados!`);
        
        if (result.errors.length > 0) {
          console.warn("Some properties had errors:", result.errors);
        }
      } else {
        setError(result.errors?.[0] || "Nenhum imóvel com coordenadas encontrado");
        setProperties([]);
      }
    } catch (err) {
      setError((err as Error).message || "Erro ao buscar imóveis");
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastUrl) {
      handleSearch(lastUrl);
    }
  };

  const handleFilterChange = (min: number, max: number) => {
    setPriceRange({ min, max });
    toast.info(`Filtro aplicado: ${filteredProperties.length} imóveis`);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-96 border-r border-border bg-card flex flex-col">
          <div className="p-4 space-y-4 border-b border-border">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            
            {properties.length > 0 && (
              <PriceFilter
                minPrice={priceBounds.min}
                maxPrice={priceBounds.max}
                onFilterChange={handleFilterChange}
              />
            )}
          </div>

          <div className="flex-1 p-4 overflow-hidden">
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} onRetry={lastUrl ? handleRetry : undefined} />
            ) : (
              <PropertyList
                properties={filteredProperties}
                selectedId={selectedProperty?.id}
                onSelect={setSelectedProperty}
              />
            )}
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 p-4">
          <PropertyMap
            properties={filteredProperties}
            selectedProperty={selectedProperty}
            onSelectProperty={setSelectedProperty}
          />
        </main>
      </div>
    </div>
  );
};

export default Index;
