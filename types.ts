
export interface Product {
  id: string;
  slug: string;
  title: string;
  menuTitle: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  
  // New Payment Fields
  paymentType: 'one-time' | 'recurring';
  billingCycle?: 'monthly' | 'yearly';
  setupFee?: number; // Taxa de adesão/instalação

  heroImage: string;
  features: string[];
  ctaText: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML or Markdown text
  coverImage: string;
  published: boolean;
  createdAt: string;
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
  setupFee?: number;
  isSubscription: boolean;
  billingCycle?: string;
  
  customerName: string;
  customerWhatsapp: string;
  status: 'pending' | 'active' | 'cancelled'; // Active for subscriptions
  createdAt: string;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
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

export interface EvolutionConfig {
  enabled: boolean;
  baseUrl: string; // ex: https://api.meudominio.com
  instanceName: string; // ex: toligado
  apiKey: string;
  welcomeMessage: string; // Mensagem ao criar pedido
  reminderMessage: string; // Mensagem de cobrança
}

export interface SiteConfig {
  logoText: string;
  logoImage?: string;
  logoColor: string;
  whatsapp: string;
  adminPassword?: string; // New password field
  pix: PixConfig;
  home: HomeConfig;
  evolution?: EvolutionConfig;
}

export interface AdminState {
  isAuthenticated: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  instance_name: string;
  instance_qrcode?: string;
  instance_status?: 'pending' | 'connected' | 'disconnected';
  plan?: string;
  monthly_price?: number;
  agent_prompt?: string;
  agent_active?: boolean;
  created_at: string;
  updated_at?: string;
}
