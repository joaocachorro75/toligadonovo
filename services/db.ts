
import { Lead, Product, SiteConfig, Order, BlogPost } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SITE_CONFIG, INITIAL_POSTS } from './initialData';

const BASE_URL = '/api';

// --- SISTEMA DE PERSISTÊNCIA LOCAL ---
const getLocal = <T>(key: string, defaultVal: T): T => {
  try {
    const item = localStorage.getItem(`toligado_data_${key}`);
    if (!item) return defaultVal;
    return JSON.parse(item);
  } catch (e) {
    return defaultVal;
  }
};

const setLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(`toligado_data_${key}`, JSON.stringify(data));
  } catch (e) { console.error("Falha ao salvar localmente", e); }
};

// --- NORMALIZAÇÃO DE TELEFONE ---
export const normalizePhone = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10 && cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }
  if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
  }
  return cleaned;
};

// --- AJUDANTE DE FETCH COM TIMEOUT ---
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 3000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    throw error;
  }
};

const api = {
  get: async (endpoint: string) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}${endpoint}`);
      if (!res.ok) throw new Error('Erro na rede');
      return await res.json();
    } catch (e) {
      return null;
    }
  },
  post: async (endpoint: string, data: any) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.ok ? await res.json() : null;
    } catch (e) {
      return null;
    }
  }
};

export const db = {
  login: async (user: string, pass: string): Promise<boolean> => {
    const localConfig = getLocal<SiteConfig>('config', INITIAL_SITE_CONFIG);
    const correctPass = localConfig.adminPassword || 'admin123';
    if (user.trim() === 'admin' && pass.trim() === correctPass) {
      localStorage.setItem('toligado_auth_token', 'token-local-' + Date.now());
      localStorage.setItem('toligado_mode', 'offline');
      fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      }).catch(() => {});
      return true;
    }
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      }, 2500);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('toligado_auth_token', data.token);
          localStorage.setItem('toligado_mode', 'online');
          return true;
        }
      }
    } catch (e) {}
    throw new Error('Usuário ou senha incorretos.');
  },

  logout: () => {
    localStorage.removeItem('toligado_auth_token');
    localStorage.removeItem('toligado_mode');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('toligado_auth_token');
  },

  getProducts: async (): Promise<Product[]> => {
    const onlineData = await api.get('/products');
    if (onlineData && Array.isArray(onlineData) && onlineData.length > 0) {
      setLocal('products', onlineData);
      return onlineData;
    }
    return getLocal('products', INITIAL_PRODUCTS);
  },

  saveProduct: async (product: Product) => {
    const products = getLocal<Product[]>('products', INITIAL_PRODUCTS);
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) products[index] = product;
    else products.push(product);
    setLocal('products', products);
    await api.post('/products', products);
  },

  createProduct: async (product: Omit<Product, 'id'>) => {
    const products = getLocal<Product[]>('products', INITIAL_PRODUCTS);
    const newProduct = { ...product, id: crypto.randomUUID() };
    products.push(newProduct);
    setLocal('products', products);
    await api.post('/products', products);
  },

  deleteProduct: async (id: string) => {
    let products = getLocal<Product[]>('products', INITIAL_PRODUCTS);
    products = products.filter(p => p.id !== id);
    setLocal('products', products);
    await api.post('/products', products);
  },

  getProductBySlug: async (slug: string): Promise<Product | undefined> => {
    const products = await db.getProducts();
    return products.find(p => p.slug === slug);
  },

  getPosts: async (): Promise<BlogPost[]> => {
    const online = await api.get('/posts');
    if (online && Array.isArray(online) && online.length > 0) {
      setLocal('posts', online);
      return online;
    }
    return getLocal('posts', INITIAL_POSTS);
  },

  createPost: async (post: any) => {
    const posts = await db.getPosts();
    const newPost = { ...post, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    posts.unshift(newPost);
    setLocal('posts', posts);
    // Fix: use '/posts' instead of '/api/posts' since api.post prepends BASE_URL
    await api.post('/posts', newPost);
  },

  updatePost: async (post: BlogPost) => {
    const posts = await db.getPosts();
    const idx = posts.findIndex(p => p.id === post.id);
    if (idx !== -1) posts[idx] = post;
    setLocal('posts', posts);
    try {
      await fetchWithTimeout(`${BASE_URL}/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
    } catch (e) {}
  },

  deletePost: async (id: string) => {
    const posts = (await db.getPosts()).filter(p => p.id !== id);
    setLocal('posts', posts);
    try {
      await fetchWithTimeout(`${BASE_URL}/posts/${id}`, { method: 'DELETE' });
    } catch (e) {}
  },

  getPostBySlug: async (slug: string) => {
    const posts = await db.getPosts();
    return posts.find(p => p.slug === slug);
  },

  getLeads: async (): Promise<Lead[]> => {
    const online = await api.get('/leads');
    if (online) {
      setLocal('leads', online);
      return online;
    }
    return getLocal('leads', []);
  },

  addLead: async (name: string, whatsapp: string, originPage: string) => {
    const newLead: Lead = {
      id: crypto.randomUUID(),
      name,
      whatsapp: normalizePhone(whatsapp),
      originPage,
      createdAt: new Date().toISOString(),
      status: 'new'
    };
    const leads = getLocal<Lead[]>('leads', []);
    leads.unshift(newLead);
    setLocal('leads', leads);
    await api.post('/leads', newLead);
  },

  // Fix: Added deleteLead to support AdminDashboard
  deleteLead: async (id: string) => {
    let leads = getLocal<Lead[]>('leads', []);
    leads = leads.filter(l => l.id !== id);
    setLocal('leads', leads);
    try {
      await fetchWithTimeout(`${BASE_URL}/leads/${id}`, { method: 'DELETE' });
    } catch (e) {}
  },

  // Fix: Added updateLead to support AdminDashboard status changes
  updateLead: async (lead: Lead) => {
    const leads = getLocal<Lead[]>('leads', []);
    const index = leads.findIndex(l => l.id === lead.id);
    if (index >= 0) leads[index] = lead;
    setLocal('leads', leads);
    try {
      await fetchWithTimeout(`${BASE_URL}/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
    } catch (e) {}
  },

  getOrders: async (): Promise<Order[]> => {
    const online = await api.get('/orders');
    if (online) {
      setLocal('orders', online);
      return online;
    }
    return getLocal('orders', []);
  },

  addOrder: async (title: string, price: number, name: string, whatsapp: string, extra: any) => {
    const newOrder: Order = {
      id: crypto.randomUUID(),
      productTitle: title,
      productPrice: price,
      customerName: name,
      customerWhatsapp: normalizePhone(whatsapp),
      status: 'pending',
      createdAt: new Date().toISOString(),
      isSubscription: extra.isSubscription || false,
      ...extra
    };
    const orders = getLocal<Order[]>('orders', []);
    orders.unshift(newOrder);
    setLocal('orders', orders);
    await api.post('/orders', newOrder);
  },

  // Fix: Added deleteOrder to support AdminDashboard
  deleteOrder: async (id: string) => {
    let orders = getLocal<Order[]>('orders', []);
    orders = orders.filter(o => o.id !== id);
    setLocal('orders', orders);
    try {
      await fetchWithTimeout(`${BASE_URL}/orders/${id}`, { method: 'DELETE' });
    } catch (e) {}
  },

  // Fix: Added updateOrder to support AdminDashboard status changes
  updateOrder: async (order: Order) => {
    const orders = getLocal<Order[]>('orders', []);
    const index = orders.findIndex(o => o.id === order.id);
    if (index >= 0) orders[index] = order;
    setLocal('orders', orders);
    try {
      await fetchWithTimeout(`${BASE_URL}/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
    } catch (e) {}
  },

  getConfig: async (): Promise<SiteConfig> => {
    const online = await api.get('/config');
    if (online) {
      setLocal('config', online);
      return online;
    }
    return getLocal('config', INITIAL_SITE_CONFIG);
  },

  saveConfig: async (config: SiteConfig) => {
    setLocal('config', config);
    await api.post('/config', config);
  },

  checkEvolutionStatus: async (): Promise<any> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/evolution/status`);
      if (res.ok) return await res.json();
      return { status: 'error' };
    } catch (e) {
      return { status: 'error' };
    }
  },

  // Fix: Added sendPaymentReminder to support AdminDashboard Evolution API integration
  sendPaymentReminder: async (orderId: string): Promise<boolean> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/evolution/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.success;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  // Fix: Added sendTestMessage to support AdminDashboard Evolution API test functionality
  sendTestMessage: async (phone: string): Promise<boolean> => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/evolution/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.success;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  uploadImage: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (e) {}
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
};
