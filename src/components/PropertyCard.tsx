import { ExternalLink, MapPin } from "lucide-react";
import type { Property } from "@/types/property";

interface PropertyCardProps {
  property: Property;
  isSelected?: boolean;
  onClick?: () => void;
}

export const PropertyCard = ({ property, isSelected, onClick }: PropertyCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`property-card cursor-pointer ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="relative h-36 overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        <div className="absolute top-2 right-2 price-tag">
          {property.price}
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 mb-2">
          {property.title}
        </h3>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <MapPin className="w-3 h-3" />
          <span>
            {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
          </span>
        </div>

        <a
          href={property.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="btn-accent w-full flex items-center justify-center gap-2 text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          Ver Anúncio
        </a>
      </div>
    </div>
  );
};
