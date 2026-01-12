import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { Property } from "@/types/property";
import { PropertyPopup } from "./PropertyPopup";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon
const createCustomIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: "custom-marker-wrapper",
    html: `
      <div style="
        background: ${isSelected ? "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" : "linear-gradient(135deg, #0c7792 0%, #085a6e 100%)"};
        border: 3px solid white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: ${isSelected ? "scale(1.3)" : "scale(1)"};
        transition: transform 0.2s;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface MapCenterProps {
  center: [number, number];
  zoom: number;
}

const MapCenter = ({ center, zoom }: MapCenterProps) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

interface PropertyMapProps {
  properties: Property[];
  selectedProperty?: Property;
  onSelectProperty: (property: Property) => void;
}

export const PropertyMap = ({ properties, selectedProperty, onSelectProperty }: PropertyMapProps) => {
  const mapRef = useRef<L.Map>(null);

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
    
    let zoom = 13;
    if (maxSpread > 0.5) zoom = 10;
    else if (maxSpread > 0.2) zoom = 11;
    else if (maxSpread > 0.1) zoom = 12;

    return { center: [avgLat, avgLng] as [number, number], zoom };
  }, [properties]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-lg">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapCenter center={center} zoom={zoom} />

        {properties.map((property) => (
          <Marker
            key={property.id}
            position={[property.latitude, property.longitude]}
            icon={createCustomIcon(selectedProperty?.id === property.id)}
            eventHandlers={{
              click: () => onSelectProperty(property),
            }}
          >
            <Popup>
              <PropertyPopup property={property} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
