export interface Product {
  id: string;
  slug: string;
  title: string;
  menuTitle: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  heroImage: string;
  features: string[];
  ctaText: string;
}

export interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  originPage: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'closed' | 'lost';
}

export interface Order {
  id: string;
  productTitle: string;
  productPrice: number;
  customerName: string;
  customerWhatsapp: string;
  status: 'pending' | 'approved' | 'cancelled';
  createdAt: string;
}

export interface PixConfig {
  keyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  key: string;
  beneficiary: string;
}

export interface HomeConfig {
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  servicesTitle: string;
  servicesDescription: string;
  contactTitle: string;
  contactDescription: string;
}

export interface SiteConfig {
  logoText: string;
  logoImage?: string; // Base64 image string
  logoColor: string;
  whatsapp: string;
  pix: PixConfig;
  home: HomeConfig;
}

export interface AdminState {
  isAuthenticated: boolean;
}