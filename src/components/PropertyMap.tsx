import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Property } from "@/types/property";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface PropertyMapProps {
  properties: Property[];
  selectedProperty?: Property;
  onSelectProperty: (property: Property) => void;
}

export const PropertyMap = ({ properties, selectedProperty, onSelectProperty }: PropertyMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Calculate center based on properties
  const { center, zoom } = useMemo(() => {
    if (properties.length === 0) {
      // Default to Brasília center
      return { center: [-15.7942, -47.8822] as [number, number], zoom: 11 };
    }

    const lats = properties.map(p => p.latitude);
    const lngs = properties.map(p => p.longitude);
    
    const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    // Calculate zoom based on spread
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);
    
    let calculatedZoom = 13;
    if (maxSpread > 0.5) calculatedZoom = 10;
    else if (maxSpread > 0.2) calculatedZoom = 11;
    else if (maxSpread > 0.1) calculatedZoom = 12;

    return { center: [avgLat, avgLng] as [number, number], zoom: calculatedZoom };
  }, [properties]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current).setView(center, zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map view when center/zoom changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update markers when properties change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    properties.forEach(property => {
      const isSelected = selectedProperty?.id === property.id;
      
      const icon = L.divIcon({
        className: "custom-marker-wrapper",
        html: `
          <div style="
            background: ${isSelected ? "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" : "linear-gradient(135deg, #0c7792 0%, #085a6e 100%)"};
            border: 3px solid white;
            border-radius: 50%;
            width: ${isSelected ? "40px" : "32px"};
            height: ${isSelected ? "40px" : "32px"};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.2s;
          ">
            <svg width="${isSelected ? "20" : "16"}" height="${isSelected ? "20" : "16"}" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
          </div>
        `,
        iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
        iconAnchor: [isSelected ? 20 : 16, isSelected ? 40 : 32],
        popupAnchor: [0, isSelected ? -40 : -32],
      });

      const marker = L.marker([property.latitude, property.longitude], { icon })
        .addTo(mapRef.current!);

      // Create popup content
      const popupContent = `
        <div style="width: 280px; font-family: inherit;">
          <div style="position: relative; height: 160px; overflow: hidden;">
            <img 
              src="${property.image}" 
              alt="${property.title}"
              style="width: 100%; height: 100%; object-fit: cover;"
              onerror="this.src='/placeholder.svg'"
            />
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); padding: 12px;">
              <span style="background: hsl(199 89% 32%); color: white; font-weight: bold; padding: 4px 12px; border-radius: 8px; font-size: 14px;">
                ${property.price}
              </span>
            </div>
          </div>
          <div style="padding: 16px; background: white;">
            <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 12px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${property.title}
            </h3>
            <a 
              href="${property.link}" 
              target="_blank" 
              rel="noopener noreferrer"
              style="display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #0c7792 0%, #085a6e 100%); color: white; font-weight: 600; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 14px;"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              Ver no DFImóveis
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: "map-popup",
      });

      marker.on("click", () => {
        onSelectProperty(property);
      });

      markersRef.current.push(marker);
    });
  }, [properties, selectedProperty, onSelectProperty]);

  // Pan to selected property
  useEffect(() => {
    if (mapRef.current && selectedProperty) {
      mapRef.current.setView([selectedProperty.latitude, selectedProperty.longitude], 14);
    }
  }, [selectedProperty]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-lg">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
