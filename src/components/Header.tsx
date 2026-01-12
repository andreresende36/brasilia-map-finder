import { MapPin, Building2 } from "lucide-react";

export const Header = () => {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            DFImóveis Mapper
            <MapPin className="w-5 h-5 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Mapeie imóveis do DFImóveis em Brasília
          </p>
        </div>
      </div>
    </header>
  );
};
