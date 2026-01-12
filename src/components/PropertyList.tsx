import { Property } from "@/types/property";
import { PropertyCard } from "./PropertyCard";
import { Building2 } from "lucide-react";

interface PropertyListProps {
  properties: Property[];
  selectedId?: string;
  onSelect: (property: Property) => void;
}

export const PropertyList = ({ properties, selectedId, onSelect }: PropertyListProps) => {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
        <Building2 className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">Nenhum imóvel encontrado</p>
        <p className="text-xs mt-1">Cole uma URL de busca para começar</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="font-semibold text-sm">{properties.length} imóveis</span>
      </div>
      
      <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            isSelected={selectedId === property.id}
            onClick={() => onSelect(property)}
          />
        ))}
      </div>
    </div>
  );
};
