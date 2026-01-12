export interface Property {
  id: string;
  title: string;
  price: string;
  priceValue: number;
  image: string;
  link: string;
  latitude: number;
  longitude: number;
}

export interface ScrapingResult {
  success: boolean;
  properties: Property[];
  total: number;
  errors: string[];
}
