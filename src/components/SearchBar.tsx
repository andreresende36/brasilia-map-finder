import { useState } from "react";
import { Search, Loader2, MapPin } from "lucide-react";

interface SearchBarProps {
  onSearch: (url: string) => void;
  isLoading: boolean;
}

export const SearchBar = ({ onSearch, isLoading }: SearchBarProps) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onSearch(url.trim());
    }
  };

  const exampleUrl = "https://www.dfimoveis.com.br/aluguel/df/todos/apartamento?valorfinal=5000";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <MapPin className="w-4 h-4" />
          <span>Cole uma URL de busca do DFImóveis</span>
        </div>
        
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={exampleUrl}
              className="search-input pl-12 pr-4"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="btn-primary flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Buscar Imóveis</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Exemplo: {exampleUrl}
        </p>
      </div>
    </form>
  );
};
