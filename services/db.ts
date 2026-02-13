import { Lead, Product, SiteConfig, Order } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SITE_CONFIG } from './initialData';

// API Helper
const api = {
  get: async (endpoint: string) => {
    try {
      const res = await fetch(`/api${endpoint}`);
      if (!res.ok) throw new Error('API Error');
      return await res.json();
    } catch (e) {
      console.error(`Error fetching ${endpoint}:`, e);
      return null;
    }
  },
  post: async (endpoint: string, data: any) => {
    try {
      const res = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e) {
      console.error(`Error posting ${endpoint}:`, e);
      throw e;
    }
  },
  put: async (endpoint: string, data: any) => {
    try {
      const res = await fetch(`/api${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e) {
      console.error(`Error putting ${endpoint}:`, e);
      throw e;
    }
  },
  delete: async (endpoint: string) => {
    try {
      const res = await fetch(`/api${endpoint}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) {
      console.error(`Error deleting ${endpoint}:`, e);
      throw e;
    }
  }
};

export const db = {
  // --- Products ---
  getProducts: async (): Promise<Product[]> => {
    const data = await api.get('/products');
    // Fallback to initial if empty or null
    if (!data || data.length === 0) return INITIAL_PRODUCTS;
    return data;
  },

  saveProduct: async (product: Product) => {
    const products = await db.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    await api.post('/products', products);
  },

  createProduct: async (product: Omit<Product, 'id'>) => {
    const products = await db.getProducts();
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID()
    };
    products.push(newProduct);
    await api.post('/products', products);
  },

  deleteProduct: async (id: string) => {
    let products = await db.getProducts();
    products = products.filter(p => p.id !== id);
    await api.post('/products', products);
  },

  getProductBySlug: async (slug: string): Promise<Product | undefined> => {
    const products = await db.getProducts();
    return products.find(p => p.slug === slug);
  },

  // --- Leads ---
  getLeads: async (): Promise<Lead[]> => {
    return (await api.get('/leads')) || [];
  },

  addLead: async (name: string, whatsapp: string, originPage: string) => {
    const cleaned = whatsapp.replace(/\D/g, '');
    const formatted = cleaned.length >= 10 ? (cleaned.startsWith('55') ? `+${cleaned}` : `+55${cleaned}`) : whatsapp;

    const newLead: Lead = {
      id: crypto.randomUUID(),
      name,
      whatsapp: formatted,
      originPage,
      createdAt: new Date().toISOString(),
      status: 'new'
    };
    
    await api.post('/leads', newLead);
    return newLead;
  },

  updateLead: async (lead: Lead) => {
    await api.put(`/leads/${lead.id}`, lead);
  },

  deleteLead: async (id: string) => {
    await api.delete(`/leads/${id}`);
  },

  // --- Orders ---
  getOrders: async (): Promise<Order[]> => {
    return (await api.get('/orders')) || [];
  },

  addOrder: async (productTitle: string, productPrice: number, customerName: string, whatsapp: string) => {
    const cleaned = whatsapp.replace(/\D/g, '');
    const formatted = cleaned.length >= 10 ? (cleaned.startsWith('55') ? `+${cleaned}` : `+55${cleaned}`) : whatsapp;

    const newOrder: Order = {
      id: crypto.randomUUID(),
      productTitle,
      productPrice,
      customerName,
      customerWhatsapp: formatted,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await api.post('/orders', newOrder);
  },

  updateOrder: async (order: Order) => {
    await api.put(`/orders/${order.id}`, order);
  },

  deleteOrder: async (id: string) => {
    await api.delete(`/orders/${id}`);
  },

  // --- Config ---
  getConfig: async (): Promise<SiteConfig> => {
    const data = await api.get('/config');
    // Deep merge ensuring new properties
    return {
      ...INITIAL_SITE_CONFIG,
      ...data,
      home: { ...INITIAL_SITE_CONFIG.home, ...(data?.home || {}) },
      pix: { ...INITIAL_SITE_CONFIG.pix, ...(data?.pix || {}) }
    };
  },

  saveConfig: async (config: SiteConfig) => {
    await api.post('/config', config);
  },

  // --- Upload ---
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) throw new Error('Upload failed');
    
    const data = await res.json();
    return data.url;
  },

  // --- Auth ---
  login: async (user: string, pass: string): Promise<boolean> => {
    const res = await api.post('/login', { user, pass });
    if (res && res.success) {
      localStorage.setItem('toligado_auth_token', res.token);
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem('toligado_auth_token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('toligado_auth_token');
  }
};