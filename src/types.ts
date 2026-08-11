export type SourceCountry = 'USA' | 'Europe' | 'Asia';

export type LaptopStatus = 'Disponible' | 'Arrivage imminent' | 'Rupture';

export type LaptopCategory = 'Laptop' | 'Telephone' | 'Accessoire' | 'Gadget' | string;

export interface Laptop {
  id: string;
  brand: string;
  model: string;
  processor: string;
  ram: string; // e.g. "16GB"
  storage: string; // e.g. "512GB SSD"
  screenSize: string; // e.g. '13.3"' or '15.6"'
  condition: 'Excellent' | 'Comme neuf' | 'Très bon état';
  source: SourceCountry;
  image: string;
  price: number; // in FCFA (e.g., 450000) or USD equivalent
  stockQuantity: number;
  status: LaptopStatus;
  description: string;
  category: LaptopCategory;
  subCategory?: string;
  shortDescription?: string;
  skuByAdmin?: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  isRecommended?: boolean;
}

export interface QuoteCustomizations {
  ramUpgrade: string; // "Aucune" | "32GB" | "64GB"
  storageUpgrade: string; // "Aucun" | "1TB SSD" | "2TB SSD"
  osOption: string; // "Windows 11 Pro" | "Windows 10 Pro" | "macOS Sequoia" | "Ubuntu Linux"
  accessories: string[]; // ["Housse de protection", "Souris sans fil", "Support ventilé"]
}

export type QuoteStatus = 
  | 'Demande reçue' 
  | 'Devis validé' 
  | 'En préparation' 
  | 'Prêt pour livraison' 
  | 'Livré' 
  | 'Refusé';

export interface QuoteRequest {
  id: string;
  laptopId: string;
  laptopBrand: string;
  laptopModel: string;
  basePrice: number;
  finalPrice: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCity: string;
  customizations: QuoteCustomizations;
  additionalNotes?: string;
  status: QuoteStatus;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface RealtimeNotification {
  id: string;
  quoteId: string;
  clientEmail: string;
  title: string;
  message: string;
  status: QuoteStatus;
  timestamp: string;
  isRead: boolean;
}
