import { ExternalLink } from "lucide-react";
import type { Property } from "@/types/property";

interface PropertyPopupProps {
  property: Property;
}

export const PropertyPopup = ({ property }: PropertyPopupProps) => {
  return (
    <div className="w-72">
      <div className="relative h-40 overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <span className="price-tag">{property.price}</span>
        </div>
      </div>

      <div className="p-4 bg-card">
        <h3 className="font-semibold text-sm line-clamp-2 mb-3">
          {property.title}
        </h3>

        <a
          href={property.link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2"
        >
          <ExternalLink className="w-4 h-4" />
          Ver no DFImóveis
        </a>
      </div>
    </div>
  );
};
