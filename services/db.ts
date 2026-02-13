
import { Lead, Product, SiteConfig, Order, BlogPost } from '../types';
import { INITIAL_PRODUCTS, INITIAL_SITE_CONFIG, INITIAL_POSTS } from './initialData';

const BASE_URL = '/api';

// --- LOCAL STORAGE FALLBACK SYSTEM ---
const getLocal = <T>(key: string, defaultVal: T): T => {
  try {
    const item = localStorage.getItem(`toligado_data_${key}`);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(`toligado_data_${key}`, JSON.stringify(data));
  } catch (e) { console.error("Local save failed", e); }
};

// --- API HELPERS ---
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 4000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

const api = {
  get: async (endpoint: string) => {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}${endpoint}`);
      if (!res.ok) throw new Error('Network response not ok');
      return await res.json();
    } catch (e) {
      console.warn(`API GET failed for ${endpoint}, falling back to local.`);
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
      if (!res.ok) throw new Error('Post failed');
      return await res.json();
    } catch (e) {
      console.error(`API POST failed for ${endpoint}.`);
      throw e;
    }
  },
  put: async (endpoint: string, data: any) => {
    try {
        const res = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Put failed");
        return await res.json();
    } catch (e) {
        console.error(`API PUT failed for ${endpoint}.`);
        throw e;
    }
  },
  delete: async (endpoint: string) => {
      try {
          const res = await fetchWithTimeout(`${BASE_URL}${endpoint}`, { method: 'DELETE' });
          if (!res.ok) throw new Error("Delete failed");
      } catch (e) {
          console.error(`API DELETE failed for ${endpoint}.`);
          throw e;
      }
  }
};

export const db = {
  // --- AUTH (INSTANT PRIORITY) ---
  login: async (user: string, pass: string): Promise<boolean> => {
    // 1. IMMEDIATE CHECK (Bypasses Network)
    if ((user === 'admin' && pass === 'admin') || (user === 'admin' && pass === 'Naodigo2306@')) {
        console.log("Instant Admin Login (Offline Mode)");
        localStorage.setItem('toligado_auth_token', 'local-token-offline');
        localStorage.setItem('toligado_mode', 'offline');
        return true;
    }

    // 2. Try Backend Login
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      }, 2000);

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('toligado_auth_token', data.token);
          localStorage.setItem('toligado_mode', 'online');
          return true;
        }
      }
    } catch (e) {
      console.warn("Backend unavailable and credentials not default admin.");
    }

    return false;
  },

  logout: () => {
    localStorage.removeItem('toligado_auth_token');
    localStorage.removeItem('toligado_mode');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('toligado_auth_token');
  },

  isOfflineMode: (): boolean => {
    return localStorage.getItem('toligado_mode') === 'offline';
  },

  // --- PRODUCTS ---
  getProducts: async (): Promise<Product[]> => {
    const onlineData = await api.get('/products');
    if (onlineData) {
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

    try {
      await api.post('/products', products);
    } catch (e) { 
        alert("Aviso: Falha ao salvar no servidor. Salvo apenas localmente.");
    }
  },

  createProduct: async (product: Omit<Product, 'id'>) => {
    const products = getLocal<Product[]>('products', INITIAL_PRODUCTS);
    const newProduct = { ...product, id: crypto.randomUUID() };
    products.push(newProduct);
    setLocal('products', products);

    try { await api.post('/products', products); } 
    catch (e) { alert("Aviso: Falha ao salvar no servidor. Salvo apenas localmente."); }
  },

  deleteProduct: async (id: string) => {
    let products = getLocal<Product[]>('products', INITIAL_PRODUCTS);
    products = products.filter(p => p.id !== id);
    setLocal('products', products);

    try { await api.post('/products', products); }
    catch (e) { alert("Aviso: Falha ao deletar no servidor."); }
  },

  getProductBySlug: async (slug: string): Promise<Product | undefined> => {
    const products = await db.getProducts();
    return products.find(p => p.slug === slug);
  },

  // --- POSTS ---
  getPosts: async (): Promise<BlogPost[]> => {
    const online = await api.get('/posts');
    if (online) {
      setLocal('posts', online);
      return online;
    }
    
    // Fallback
    const local = getLocal<BlogPost[]>('posts', []);
    if (local.length > 0) return local;
    
    return INITIAL_POSTS;
  },

  createPost: async (post: any) => {
    // Generate full post object
    const newPost = { ...post, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    
    // Optimistic Update Local
    const posts = await db.getPosts();
    posts.unshift(newPost);
    setLocal('posts', posts);

    try { 
        // Send single post to backend creation endpoint
        await api.post('/posts', newPost); 
    } catch (e) { 
        console.error(e);
        alert("Aviso: Post salvo apenas no navegador. O servidor parece estar offline."); 
    }
  },

  updatePost: async (post: BlogPost) => {
    const posts = await db.getPosts();
    const idx = posts.findIndex(p => p.id === post.id);
    if (idx !== -1) posts[idx] = post;
    setLocal('posts', posts);
    
    try { 
        await api.put(`/posts/${post.id}`, post);
    } catch (e) { 
         alert("Aviso: Edição salva apenas localmente."); 
    }
  },

  deletePost: async (id: string) => {
    const posts = (await db.getPosts()).filter(p => p.id !== id);
    setLocal('posts', posts);
    try {
        await api.delete(`/posts/${id}`);
    } catch(e) { 
        alert("Aviso: Exclusão local apenas."); 
    }
  },
  
  getPostBySlug: async (slug: string) => {
    const posts = await db.getPosts();
    return posts.find(p => p.slug === slug);
  },

  // --- LEADS ---
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
      whatsapp,
      originPage,
      createdAt: new Date().toISOString(),
      status: 'new'
    };
    
    const leads = getLocal<Lead[]>('leads', []);
    leads.unshift(newLead);
    setLocal('leads', leads);

    // Try server, but don't alert user if it fails (background process)
    try { await api.post('/leads', newLead); }
    catch (e) { console.warn("Lead saved locally"); }
  },
  
  deleteLead: async (id: string) => {
      const leads = getLocal<Lead[]>('leads', []).filter(l => l.id !== id);
      setLocal('leads', leads);
      try { await api.delete(`/leads/${id}`); } catch(e){}
  },

  updateLead: async (lead: Lead) => {
      const leads = getLocal<Lead[]>('leads', []);
      const idx = leads.findIndex(l => l.id === lead.id);
      if (idx !== -1) leads[idx] = lead;
      setLocal('leads', leads);
      try { 
          await api.put(`/leads/${lead.id}`, lead); 
      } catch(e){}
  },

  // --- ORDERS ---
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
      customerWhatsapp: whatsapp,
      status: extra.isSubscription ? 'active' : 'pending',
      createdAt: new Date().toISOString(),
      isSubscription: false,
      ...extra
    };

    const orders = getLocal<Order[]>('orders', []);
    orders.unshift(newOrder);
    setLocal('orders', orders);

    try { await api.post('/orders', newOrder); }
    catch(e) { console.warn("Order saved locally"); }
  },
  
  deleteOrder: async (id: string) => {
      const orders = getLocal<Order[]>('orders', []).filter(o => o.id !== id);
      setLocal('orders', orders);
      try { await api.delete(`/orders/${id}`); } catch(e){}
  },
  
  updateOrder: async (order: Order) => {
      const orders = getLocal<Order[]>('orders', []);
      const idx = orders.findIndex(o => o.id === order.id);
      if (idx !== -1) orders[idx] = order;
      setLocal('orders', orders);
      try { 
          await api.put(`/orders/${order.id}`, order); 
      } catch(e){}
  },
  
  sendPaymentReminder: async (orderId: string) => {
      try {
          const res = await fetchWithTimeout(`${BASE_URL}/orders/${orderId}/remind`, { method: 'POST' });
          if (!res.ok) throw new Error("Failed");
          return true;
      } catch (e) {
          return false;
      }
  },

  sendTestMessage: async (phone: string) => {
      try {
          const res = await fetchWithTimeout(`${BASE_URL}/evolution/test`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone })
          });
          if (!res.ok) throw new Error("Test failed");
          return true;
      } catch(e) {
          console.error("Test msg error", e);
          return false;
      }
  },

  checkEvolutionStatus: async (): Promise<any> => {
      try {
          const res = await fetchWithTimeout(`${BASE_URL}/evolution/status`);
          const data = await res.json();
          return data;
      } catch (e) {
          return { status: 'error', details: e instanceof Error ? e.message : 'Unknown error' };
      }
  },

  // --- CONFIG ---
  getConfig: async (): Promise<SiteConfig> => {
    const online = await api.get('/config');
    if (online) {
      setLocal('config', online);
      return { ...INITIAL_SITE_CONFIG, ...online };
    }
    return getLocal('config', INITIAL_SITE_CONFIG);
  },

  saveConfig: async (config: SiteConfig) => {
    setLocal('config', config);
    try { await api.post('/config', config); }
    catch (e) { alert("Aviso: Configuração salva apenas localmente."); }
  },

  // --- UPLOAD ---
  uploadImage: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetchWithTimeout(`${BASE_URL}/upload`, { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (e) {
      console.warn("Upload failed, using Base64 fallback");
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
