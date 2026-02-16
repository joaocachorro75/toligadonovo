// FIX: Disable SSL verification for internal Docker communication (EasyPanel/Coolify)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

// Robust Fetch Import
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args)).catch(() => global.fetch(...args));

// FormData (Node.js 18+ já tem global, mas garante)
const FormData = global.FormData || require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
const DIST_PATH = path.join(__dirname, 'dist');
app.use(express.static(DIST_PATH));

const UPLOADS_DIR = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// Data setup
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database_toligado.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ============================================
// MYSQL SUPPORT (opcional, fallback para JSON)
// ============================================
let mysqlPool = null;
let useMySQL = false;

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || null,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || null,
  password: process.env.MYSQL_PASSWORD || null,
  database: process.env.MYSQL_DATABASE || null
};

// Verifica se MySQL está configurado
if (MYSQL_CONFIG.host && MYSQL_CONFIG.user && MYSQL_CONFIG.database) {
  try {
    const mysql = require('mysql2/promise');
    mysqlPool = mysql.createPool(MYSQL_CONFIG);
    useMySQL = true;
    console.log('✅ MySQL conectado!');
  } catch (e) {
    console.log('⚠️ MySQL não disponível, usando JSON como fallback');
    useMySQL = false;
  }
} else {
  console.log('📦 Usando JSON como banco de dados');
}

// Tabelas MySQL - cada CREATE TABLE separado
const CREATE_TABLES = [
  `CREATE TABLE IF NOT EXISTS config (
    id INT PRIMARY KEY DEFAULT 1,
    data JSON NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(50) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(50) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    whatsapp VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    stage VARCHAR(50) DEFAULT 'welcome',
    interest VARCHAR(255),
    messages JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_whatsapp (whatsapp)
  )`
];

// Inicializa tabelas MySQL
async function initMySQL() {
  if (!useMySQL || !mysqlPool) return;
  
  try {
    const conn = await mysqlPool.getConnection();
    for (const sql of CREATE_TABLES) {
      await conn.query(sql);
    }
    conn.release();
    console.log('✅ Tabelas MySQL criadas/verificadas');
  } catch (e) {
    console.error('❌ Erro ao criar tabelas:', e.message);
  }
}

initMySQL();

// ============================================
// INITIAL DATA
// ============================================
const INITIAL_DATA = {
  config: {
    logoText: 'To-Ligado.com',
    logoColor: '#06b6d4',
    whatsapp: '5591980124904',
    adminPassword: 'admin123',
    pix: { keyType: 'email', key: 'contato@to-ligado.com', beneficiary: 'To-Ligado Soluções' },
    home: {
      heroTitle: 'Sua Empresa',
      heroHighlight: 'No Futuro Agora',
      heroDescription: 'Desenvolvemos sites de alta performance, automações de marketing e soluções com IA para escalar o seu negócio.',
      servicesTitle: 'Nossas Soluções',
      servicesDescription: 'Tecnologia de ponta envelopada em produtos simples de contratar e usar.',
      contactTitle: 'Pronto para o próximo nível?',
      contactDescription: 'Não deixe sua empresa parada no tempo. A tecnologia avança rápido.'
    },
    evolution: {
        enabled: false,
        baseUrl: 'https://api.evolution-api.com',
        instanceName: 'minha-instancia',
        apiKey: '',
        welcomeMessage: 'Olá! Recebemos seu pedido de *{produto}*.',
        reminderMessage: 'Olá *{cliente}*! Lembrete de renovação.'
    }
  },
  products: [
    {
      id: '8',
      slug: 'tv-cine-box',
      title: 'TV Cine Box 4K',
      menuTitle: 'TV Online',
      shortDescription: 'Todos os canais, filmes e séries em um só lugar.',
      fullDescription: 'Transforme sua TV, Celular ou Computador em um cinema completo. Tenha acesso a mais de 2.000 canais ao vivo, incluindo esportes, notícias, infantis e adultos (opcional), além de um catálogo on-demand com mais de 10.000 filmes e séries atualizados diariamente.',
      price: 35.00,
      paymentType: 'recurring',
      billingCycle: 'monthly',
      heroImage: 'https://images.unsplash.com/photo-1593784653277-226e3c6a4696?auto=format&fit=crop&q=80&w=2000',
      features: ['+2000 Canais Ao Vivo', 'Filmes e Séries', 'Qualidade 4K', 'Sem Antenas'],
      ctaText: 'Assinar Agora'
    },
    {
      id: '1',
      slug: 'landing-pages',
      title: 'Landing Pages de Alta Conversão',
      menuTitle: 'Landing Pages',
      shortDescription: 'Páginas que captam leads e vendem sozinhas.',
      fullDescription: 'Desenvolvemos Landing Pages otimizadas para conversão, com design moderno e carregamento ultrarrápido.',
      price: 497.00,
      paymentType: 'one-time',
      heroImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2000',
      features: ['Design Responsivo', 'Alta Velocidade', 'Otimizado SEO'],
      ctaText: 'Quero Vender Mais'
    },
    {
      id: '2',
      slug: 'zap-marketing',
      title: 'Zap Marketing + Atendente 24h',
      menuTitle: 'Zap Marketing',
      shortDescription: 'Plataforma de envio em massa e atendimento automático.',
      fullDescription: 'Automatize sua comunicação no WhatsApp. Envie mensagens em massa e tenha um atendente virtual 24h.',
      price: 199.90,
      paymentType: 'recurring',
      billingCycle: 'monthly',
      heroImage: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&q=80&w=2000',
      features: ['Envio em Massa', 'Chatbot Inteligente', 'Gestão de Grupos'],
      ctaText: 'Automatizar Agora'
    },
    {
      id: '3',
      slug: 'lojas-virtuais',
      title: 'Lojas Virtuais Profissionais',
      menuTitle: 'Lojas Virtuais',
      shortDescription: 'E-commerce completo e profissional.',
      fullDescription: 'Tenha sua própria loja online profissional com gestão de produtos e pagamentos.',
      price: 1499.00,
      paymentType: 'one-time',
      heroImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=2000',
      features: ['Painel de Gestão', 'Pagamento Integrado', 'Frete Automático'],
      ctaText: 'Montar Minha Loja'
    },
    {
      id: '4',
      slug: 'blogs-ia',
      title: 'Blogs Automáticos com IA',
      menuTitle: 'Blogs IA',
      shortDescription: 'Conteúdo infinito gerado por inteligência artificial.',
      fullDescription: 'Mantenha seu site atualizado com artigos otimizados para SEO criados automaticamente pela IA.',
      price: 89.90,
      paymentType: 'recurring',
      billingCycle: 'monthly',
      heroImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2000',
      features: ['Postagens Diárias', 'Imagens Geradas', 'Zero Esforço'],
      ctaText: 'Ativar Blog IA'
    },
    {
      id: '5',
      slug: 'sistema-delivery',
      title: 'Sistema de Delivery Completo',
      menuTitle: 'Delivery',
      shortDescription: 'Ideal para restaurantes e lanchonetes.',
      fullDescription: 'Receba pedidos diretamente no WhatsApp sem taxas de marketplace. Cardápio digital interativo.',
      price: 99.00,
      paymentType: 'recurring',
      billingCycle: 'monthly',
      heroImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=2000',
      features: ['Cardápio Digital', 'Sem Taxas por Pedido', 'Link Próprio'],
      ctaText: 'Digitalizar Restaurante'
    },
    {
      id: '6',
      slug: 'turbo-combo',
      title: 'Combinação Turbo: LP + Zap',
      menuTitle: 'Combo Turbo',
      shortDescription: 'A dupla perfeita para escalar suas vendas.',
      fullDescription: 'O poder da Landing Page para captar leads somado à automação do Zap Marketing.',
      price: 597.00,
      paymentType: 'one-time',
      heroImage: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=2000',
      features: ['LP Inclusa', '3 Meses de Zap', 'Configuração Total'],
      ctaText: 'Quero o Combo'
    },
    {
      id: '7',
      slug: 'design-grafico',
      title: 'Design Gráfico e Identidade',
      menuTitle: 'Design',
      shortDescription: 'Logomarcas e artes para redes sociais.',
      fullDescription: 'Criação de identidade visual, logotipos e materiais gráficos com qualidade de agência.',
      price: 150.00,
      paymentType: 'one-time',
      heroImage: 'https://images.unsplash.com/photo-1626785774573-4b799312c95d?auto=format&fit=crop&q=80&w=2000',
      features: ['Design Exclusivo', 'Arquivos em Alta', 'Revisões Ilimitadas'],
      ctaText: 'Solicitar Design'
    }
  ],
  posts: [
    {
      id: '1',
      title: 'Venda 24h por dia: O Poder da Automação no WhatsApp',
      slug: 'venda-24h-automacao-whatsapp',
      excerpt: 'Descubra como o Zap Marketing pode transformar seu atendimento.',
      content: 'Com nossa ferramenta de Zap Marketing, você configura um Atendente Virtual que trabalha por você 24 horas por dia.',
      coverImage: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&q=80&w=1200',
      published: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Site Institucional vs Landing Page: Onde anunciar?',
      slug: 'site-institucional-vs-landing-page',
      excerpt: 'Se você faz tráfego pago e joga o cliente na home, você está perdendo dinheiro.',
      content: 'Nossos testes mostram que Landing Pages convertem até 5x mais que sites comuns.',
      coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
      published: true,
      createdAt: new Date().toISOString()
    },
    {
        id: '3',
        title: 'O Fim da TV a Cabo? Conheça a Revolução do Streaming 4K',
        slug: 'fim-da-tv-a-cabo-revolucao-streaming',
        excerpt: 'Por que pagar caro em pacotes limitados?',
        content: 'O modelo tradicional de TV por assinatura está em colapso. Conheça a liberdade do streaming 4K.',
        coverImage: 'https://images.unsplash.com/photo-1593784653277-226e3c6a4696?auto=format&fit=crop&q=80&w=1200',
        published: true,
        createdAt: new Date().toISOString()
    },
    {
        id: '4',
        title: 'Conteúdo Infinito: Como a IA mantém seu Blog atualizado',
        slug: 'conteudo-infinito-ia-blog',
        excerpt: 'O Google ama conteúdo novo. Saiba como automatizar seu SEO.',
        content: 'Para aparecer na primeira página do Google, você precisa de conteúdo frequente. A IA faz isso por você.',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200',
        published: true,
        createdAt: new Date().toISOString()
    }
  ],
  leads: [],
  orders: []
};

// ============================================
// DB HANDLING (JSON ou MySQL)
// ============================================
let dbCache = null;

// Carregar config
async function loadConfig() {
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query('SELECT data FROM config WHERE id = 1');
      if (rows.length > 0) {
        const data = rows[0].data;
        // MySQL retorna JSON como objeto, não precisa de parse
        return typeof data === 'string' ? JSON.parse(data) : data;
      } else {
        // Inserir config inicial
        await mysqlPool.query('INSERT INTO config (id, data) VALUES (1, ?)', [JSON.stringify(INITIAL_DATA.config)]);
        return INITIAL_DATA.config;
      }
    } catch (e) {
      console.error('Erro ao carregar config MySQL:', e.message);
      return INITIAL_DATA.config;
    }
  }
  // Fallback JSON
  return loadDB().config;
}

// Salvar config
async function saveConfig(config) {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query(
        'INSERT INTO config (id, data) VALUES (1, ?) ON DUPLICATE KEY UPDATE data = ?',
        [JSON.stringify(config), JSON.stringify(config)]
      );
      return true;
    } catch (e) {
      console.error('Erro ao salvar config MySQL:', e.message);
      return false;
    }
  }
  // Fallback JSON
  const db = loadDB();
  db.config = config;
  saveDB();
  return true;
}

// Carregar produtos
async function loadProducts() {
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query('SELECT data FROM products ORDER BY created_at');
      return rows.map(r => { const d = r.data; return typeof d === "string" ? JSON.parse(d) : d; });
    } catch (e) {
      console.error('Erro ao carregar products MySQL:', e.message);
      return INITIAL_DATA.products;
    }
  }
  return loadDB().products || [];
}

// Salvar produtos
async function saveProducts(products) {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM products');
      for (const product of products) {
        await mysqlPool.query('INSERT INTO products (id, data) VALUES (?, ?)', [product.id, JSON.stringify(product)]);
      }
      return true;
    } catch (e) {
      console.error('Erro ao salvar products MySQL:', e.message);
      return false;
    }
  }
  const db = loadDB();
  db.products = products;
  saveDB();
  return true;
}

// Carregar posts
async function loadPosts() {
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query('SELECT data FROM posts ORDER BY created_at DESC');
      return rows.map(r => { const d = r.data; return typeof d === "string" ? JSON.parse(d) : d; });
    } catch (e) {
      console.error('Erro ao carregar posts MySQL:', e.message);
      return [];
    }
  }
  return loadDB().posts || [];
}

// Salvar post
async function savePost(post) {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('INSERT INTO posts (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?', 
        [post.id, JSON.stringify(post), JSON.stringify(post)]);
      return true;
    } catch (e) {
      console.error('Erro ao salvar post MySQL:', e.message);
      return false;
    }
  }
  const db = loadDB();
  if (!db.posts) db.posts = [];
  const index = db.posts.findIndex(p => p.id === post.id);
  if (index >= 0) db.posts[index] = post;
  else db.posts.unshift(post);
  saveDB();
  return true;
}

// Deletar post
async function deletePost(id) {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM posts WHERE id = ?', [id]);
      return true;
    } catch (e) {
      console.error('Erro ao deletar post MySQL:', e.message);
      return false;
    }
  }
  const db = loadDB();
  db.posts = db.posts.filter(p => p.id !== id);
  saveDB();
  return true;
}

// Carregar leads
async function loadLeads() {
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query('SELECT data FROM leads ORDER BY created_at DESC');
      return rows.map(r => { const d = r.data; return typeof d === "string" ? JSON.parse(d) : d; });
    } catch (e) {
      console.error('Erro ao carregar leads MySQL:', e.message);
      return [];
    }
  }
  return loadDB().leads || [];
}

// Salvar lead
async function saveLead(lead) {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('INSERT INTO leads (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?', 
        [lead.id, JSON.stringify(lead), JSON.stringify(lead)]);
      return true;
    } catch (e) {
      console.error('Erro ao salvar lead MySQL:', e.message);
      return false;
    }
  }
  const db = loadDB();
  if (!db.leads) db.leads = [];
  const index = db.leads.findIndex(l => l.id === lead.id);
  if (index >= 0) db.leads[index] = lead;
  else db.leads.unshift(lead);
  saveDB();
  return true;
}

// Deletar lead
async function deleteLead(id) {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM leads WHERE id = ?', [id]);
      return true;
    } catch (e) {
      console.error('Erro ao deletar lead MySQL:', e.message);
      return false;
    }
  }
  const db = loadDB();
  db.leads = db.leads.filter(l => l.id !== id);
  saveDB();
  return true;
}

// Carregar orders
async function loadOrders() {
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query('SELECT data FROM orders ORDER BY created_at DESC');
      return rows.map(r => { const d = r.data; return typeof d === "string" ? JSON.parse(d) : d; });
    } catch (e) {
      console.error('Erro ao carregar orders MySQL:', e.message);
      return [];
    }
  }
  return loadDB().orders || [];
}

// Salvar order
async function saveOrder(order) {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('INSERT INTO orders (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?', 
        [order.id, JSON.stringify(order), JSON.stringify(order)]);
      return true;
    } catch (e) {
      console.error('Erro ao salvar order MySQL:', e.message);
      return false;
    }
  }
  const db = loadDB();
  if (!db.orders) db.orders = [];
  const index = db.orders.findIndex(o => o.id === order.id);
  if (index >= 0) db.orders[index] = order;
  else db.orders.unshift(order);
  saveDB();
  return true;
}

// Deletar order
async function deleteOrder(id) {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM orders WHERE id = ?', [id]);
      return true;
    } catch (e) {
      console.error('Erro ao deletar order MySQL:', e.message);
      return false;
    }
  }
  const db = loadDB();
  db.orders = db.orders.filter(o => o.id !== id);
  saveDB();
  return true;
}

// --- JSON DB Handling (fallback) ---
const loadDB = () => {
  if (dbCache) return dbCache;
  if (!fs.existsSync(DB_FILE)) {
    dbCache = JSON.parse(JSON.stringify(INITIAL_DATA));
    saveDB();
    return dbCache;
  }
  try {
    const fileContent = fs.readFileSync(DB_FILE, 'utf8');
    dbCache = JSON.parse(fileContent);
    
    let modified = false;
    if (!dbCache.posts || dbCache.posts.length < INITIAL_DATA.posts.length) {
       dbCache.posts = INITIAL_DATA.posts;
       modified = true;
    }
    if (!dbCache.products || dbCache.products.length < INITIAL_DATA.products.length) {
        dbCache.products = INITIAL_DATA.products;
        modified = true;
    }
    if (modified) saveDB();
  } catch (e) {
    dbCache = JSON.parse(JSON.stringify(INITIAL_DATA));
    saveDB();
  }
  return dbCache;
};

const saveDB = () => {
  if (!dbCache) return;
  try {
    const tempFile = DB_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(dbCache, null, 2));
    fs.renameSync(tempFile, DB_FILE);
  } catch (e) { 
    console.error("Failed to save DB:", e); 
  }
};

loadDB();

// --- EVOLUTION API HELPER ---
const sendEvolutionMessage = async (to, text) => {
    const config = await loadConfig();
    const evolution = config.evolution;
    if (!evolution || !evolution.enabled || !evolution.baseUrl || !evolution.apiKey) return false;

    const apiKey = (evolution.apiKey || '').trim();
    const instanceName = (evolution.instanceName || '').trim();
    let baseUrl = (evolution.baseUrl || '').trim().replace(/\/$/, '');
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;

    const number = to.replace(/\D/g, '');
    const url = `${baseUrl}/message/sendText/${instanceName}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
            body: JSON.stringify({ number, text, delay: 1200, linkPreview: true })
        });
        return response.ok;
    } catch (e) {
        return false;
    }
};

// --- Routes ---
app.get('/health', (req, res) => res.status(200).json({ status: 'OK', database: useMySQL ? 'MySQL' : 'JSON' }));

app.get('/api/config', async (req, res) => res.json(await loadConfig()));

app.post('/api/config', async (req, res) => {
  await saveConfig(req.body);
  res.json({ success: true });
});

app.get('/api/products', async (req, res) => res.json(await loadProducts()));

app.post('/api/products', async (req, res) => {
  await saveProducts(req.body);
  res.json({ success: true });
});

app.get('/api/posts', async (req, res) => res.json(await loadPosts()));

app.post('/api/posts', async (req, res) => {
  await savePost(req.body);
  res.json({ success: true });
});

app.put('/api/posts/:id', async (req, res) => {
  await savePost(req.body);
  res.json({ success: true });
});

app.delete('/api/posts/:id', async (req, res) => {
  await deletePost(req.params.id);
  res.json({ success: true });
});

// Evolution API Routes
app.get('/api/evolution/status', async (req, res) => {
  const config = await loadConfig();
  const evolution = config.evolution;
  if (!evolution || !evolution.baseUrl || !evolution.apiKey) {
    return res.json({ status: 'error', details: 'Configuração incompleta' });
  }

  const apiKey = (evolution.apiKey || '').trim();
  const instanceName = (evolution.instanceName || '').trim();
  let baseUrl = (evolution.baseUrl || '').trim().replace(/\/$/, '');
  if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;

  const url = `${baseUrl}/instance/fetchInstances`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'apikey': apiKey }
    });
    const data = await response.json();
    
    let instanceData = null;
    if (Array.isArray(data)) {
      instanceData = data.find(inst => inst.name === instanceName);
    }
    
    if (instanceData) {
      const state = instanceData.connectionStatus || 'close';
      res.json({ 
        status: state === 'open' ? 'open' : 'close', 
        details: {
          name: instanceData.name,
          owner: instanceData.ownerJid,
          profileName: instanceData.profileName,
          messages: instanceData._count?.Message || 0,
          contacts: instanceData._count?.Contact || 0
        },
        code: response.status 
      });
    } else {
      res.json({ status: 'error', details: 'Instância não encontrada', code: 404 });
    }
  } catch (e) {
    res.json({ status: 'error', details: e.message });
  }
});

app.post('/api/evolution/test', async (req, res) => {
  const { phone } = req.body;
  const success = await sendEvolutionMessage(phone, "Teste de conexão To-Ligado.com!");
  res.json({ success });
});

app.post('/api/evolution/reminder', async (req, res) => {
  const { orderId } = req.body;
  const config = await loadConfig();
  const orders = await loadOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ success: false, error: 'Pedido não encontrado' });

  const message = (config.evolution?.reminderMessage || 'Lembrete de pagamento')
    .replace('{cliente}', order.customerName)
    .replace('{produto}', order.productTitle);

  const success = await sendEvolutionMessage(order.customerWhatsapp, message);
  res.json({ success });
});

// Lead Routes
app.get('/api/leads', async (req, res) => res.json(await loadLeads()));

app.post('/api/leads', async (req, res) => {
  const lead = req.body;
  await saveLead(lead);
  
  const config = await loadConfig();
  
  // Notificar admin no WhatsApp
  if (config.evolution?.enabled && config.whatsapp) {
    const msg = `🆕 *Novo Lead!*\n\n👤 Nome: ${lead.name || 'Não informado'}\n📱 WhatsApp: ${lead.phone || lead.whatsapp || 'Não informado'}`;
    await sendEvolutionMessage(config.whatsapp, msg);
  }
  
  // Enviar boas-vindas para o lead
  if (config.evolution?.enabled && (lead.phone || lead.whatsapp)) {
    const welcomeMsg = config.evolution?.welcomeMessage?.replace('{produto}', 'nossos serviços') || 'Olá! Recebemos seu contato. Em breve retornaremos!';
    await sendEvolutionMessage(lead.phone || lead.whatsapp, welcomeMsg);
  }
  
  res.json({ success: true });
});

app.put('/api/leads/:id', async (req, res) => {
  await saveLead(req.body);
  res.json({ success: true });
});

app.delete('/api/leads/:id', async (req, res) => {
  await deleteLead(req.params.id);
  res.json({ success: true });
});

// Order Routes
app.get('/api/orders', async (req, res) => res.json(await loadOrders()));

app.post('/api/orders', async (req, res) => {
  const order = req.body;
  await saveOrder(order);
  
  const config = await loadConfig();
  
  // Notificar admin no WhatsApp
  if (config.evolution?.enabled && config.whatsapp) {
    const msg = `💰 *Nova Venda!*\n\n📦 Produto: ${order.productTitle || 'Não informado'}\n👤 Cliente: ${order.customerName || 'Não informado'}\n📱 WhatsApp: ${order.customerWhatsapp || 'Não informado'}\n💵 Valor: R$ ${order.price ? order.price.toFixed(2) : '0,00'}`;
    await sendEvolutionMessage(config.whatsapp, msg);
  }
  
  // Enviar confirmação para o comprador
  if (config.evolution?.enabled && order.customerWhatsapp) {
    const confirmMsg = `✅ *Pedido Confirmado!*\n\n📦 Produto: ${order.productTitle || 'Não informado'}\n💵 Valor: R$ ${order.price ? order.price.toFixed(2) : '0,00'}\n\nObrigado pela preferência!`;
    await sendEvolutionMessage(order.customerWhatsapp, confirmMsg);
  }
  
  res.json({ success: true });
});

app.put('/api/orders/:id', async (req, res) => {
  await saveOrder(req.body);
  res.json({ success: true });
});

app.delete('/api/orders/:id', async (req, res) => {
  await deleteOrder(req.params.id);
  res.json({ success: true });
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.post('/api/login', async (req, res) => {
  const { user, pass } = req.body || {};
  const config = await loadConfig();
  const currentPassword = config?.adminPassword || 'admin123';
  if (user === 'admin' && pass === currentPassword) {
    res.json({ success: true, token: 'valid-token-' + Date.now() });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// ============================================
// AGENTE DE ATENDIMENTO WHATSAPP
// ============================================

// Chaves Gemini para o agente
const GEMINI_KEYS = [
  'AIzaSyD_T5PyecSScMkIzXlqvr9XripMqGzkkas',
  'AIzaSyBzTAJ32-wB19cioWVHWPouIzvYm54CwAI',
  'AIzaSyCZrNs4ACCbFSV47H3P2q4cGzPKl0Y0Tlg',
  'AIzaSyBtPPsvxCnQSqijn1QYlEGxJJPdHw_heYA',
  'AIzaSyA6PMwxF4if1aqWM5a55FPONVBVztHcb_Y'
];

// Sistema do agente
const AGENT_SYSTEM = `Você é o **Ligadinho**, atendente da To-Ligado.com!

Seu jeito: Amigável, descontraído, útil e humano. Use emojis com moderação.

## Seus produtos:
- **TV Cine Box 4K** (R$ 35/mês) - +2000 canais, filmes e séries
- **Landing Pages** (R$ 497) - Páginas que convertem
- **Zap Marketing** (R$ 199,90/mês) - WhatsApp automatizado
- **Lojas Virtuais** (R$ 1499) - E-commerce completo
- **Blogs com IA** (R$ 89,90/mês) - Conteúdo automático
- **Sistema Delivery** (R$ 99/mês) - Pedidos no WhatsApp
- **Design Gráfico** (R$ 150) - Logos e artes

## Seu fluxo:
1. Dê boas-vindas calorosa
2. Pergunte se conhece a To-Ligado.com
3. Se NÃO conhecer, apresente brevemente os serviços
4. Descubra qual serviço interessa
5. Tire dúvidas de forma natural
6. Quando a pessoa estiver interessada, encaminhe: "Vou te passar o link pra fecharmos: https://claw-toligadonovo.ow2qbi.easypanel.host"

## Regras:
- Seja natural, não robótico
- Pergunte o nome da pessoa se ela não disse
- Lembre do que ela disse antes
- Se ela já falou o nome, use!
- Não seja insistente, seja útil
- Respostas curtas e diretas (máximo 3 parágrafos)

Respondas sempre em português brasileiro, de forma bem humana!`;

// Buscar ou criar conversa
async function getConversation(whatsapp) {
  if (!useMySQL || !mysqlPool) return null;
  
  try {
    const [rows] = await mysqlPool.query(
      'SELECT * FROM conversations WHERE whatsapp = ?',
      [whatsapp]
    );
    
    if (rows.length > 0) {
      return rows[0];
    }
    
    // Criar nova conversa
    await mysqlPool.query(
      'INSERT INTO conversations (whatsapp, messages, stage) VALUES (?, ?, ?)',
      [whatsapp, JSON.stringify([]), 'welcome']
    );
    
    const [newRows] = await mysqlPool.query(
      'SELECT * FROM conversations WHERE whatsapp = ?',
      [whatsapp]
    );
    
    return newRows[0];
  } catch (e) {
    console.error('Erro ao buscar conversa:', e.message);
    return null;
  }
}

// Salvar mensagem na conversa
async function saveMessage(whatsapp, role, content, name = null, interest = null, stage = null) {
  if (!useMySQL || !mysqlPool) return;
  
  try {
    // Buscar mensagens atuais
    const [rows] = await mysqlPool.query(
      'SELECT messages FROM conversations WHERE whatsapp = ?',
      [whatsapp]
    );
    
    const messages = rows.length > 0 ? (typeof rows[0].messages === 'string' ? JSON.parse(rows[0].messages) : rows[0].messages) : [];
    messages.push({ role, content, timestamp: Date.now() });
    
    // Atualizar
    let updateQuery = 'UPDATE conversations SET messages = ?, updated_at = NOW()';
    const updateParams = [JSON.stringify(messages)];
    
    if (name) {
      updateQuery += ', name = ?';
      updateParams.push(name);
    }
    if (interest) {
      updateQuery += ', interest = ?';
      updateParams.push(interest);
    }
    if (stage) {
      updateQuery += ', stage = ?';
      updateParams.push(stage);
    }
    
    updateQuery += ' WHERE whatsapp = ?';
    updateParams.push(whatsapp);
    
    await mysqlPool.query(updateQuery, updateParams);
  } catch (e) {
    console.error('Erro ao salvar mensagem:', e.message);
  }
}

// API do Modal (GLM-5 - grátis e estável)
const MODAL_API_KEY = 'modalresearch_LL0OqTH_cr20RZT48ekS2NarzbVvtbV44w6_x1Y8tY0';
const MODAL_BASE_URL = 'https://api.us-west-2.modal.direct/v1';

// Função principal - usa Modal GLM-5 (grátis)
async function getAgentResponse(messages, whatsapp, name) {
  // Construir contexto
  let contextPrompt = AGENT_SYSTEM;
  if (name) {
    contextPrompt += `\n\nO nome da pessoa é: ${name}`;
  }
  
  try {
    // Formatar mensagens para OpenAI-compatible API
    const formattedMessages = [
      { role: 'system', content: contextPrompt },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    ];
    
    const response = await fetch(`${MODAL_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MODAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'zai-org/GLM-5-FP8',
        messages: formattedMessages,
        temperature: 0.9,
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;
    
    if (responseText) {
      console.log('Modal GLM-5 respondeu!');
      return responseText;
    }
    
    console.error('Modal falhou:', JSON.stringify(data));
    return null;
  } catch (e) {
    console.error('Erro no Modal:', e.message);
    return null;
  }
}

// Extrair nome da mensagem
function extractName(text) {
  const patterns = [
    /meu nome é ([A-Za-zÀ-ú]+)/i,
    /eu sou o ([A-Za-zÀ-ú]+)/i,
    /eu sou a ([A-Za-zÀ-ú]+)/i,
    /sou o ([A-Za-zÀ-ú]+)/i,
    /sou a ([A-Za-zÀ-ú]+)/i,
    /me chamo ([A-Za-zÀ-ú]+)/i,
    /nome é ([A-Za-zÀ-ú]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Extrair interesse
function extractInterest(text) {
  const products = [
    { keywords: ['tv', 'cine', 'filmes', 'séries', 'streaming', 'canais'], product: 'TV Cine Box 4K' },
    { keywords: ['landing', 'lp', 'página', 'captar', 'leads'], product: 'Landing Pages' },
    { keywords: ['zap', 'whatsapp', 'marketing', 'bot', 'automatizar', 'envio em massa'], product: 'Zap Marketing' },
    { keywords: ['loja', 'ecommerce', 'e-commerce', 'vender online'], product: 'Lojas Virtuais' },
    { keywords: ['blog', 'conteúdo', 'artigos', 'seo', 'google'], product: 'Blogs com IA' },
    { keywords: ['delivery', 'restaurante', 'lanchonete', 'pedidos', 'cardápio'], product: 'Sistema Delivery' },
    { keywords: ['design', 'logo', 'identidade', 'marca', 'arte'], product: 'Design Gráfico' }
  ];
  
  const lowerText = text.toLowerCase();
  
  for (const p of products) {
    for (const keyword of p.keywords) {
      if (lowerText.includes(keyword)) {
        return p.product;
      }
    }
  }
  return null;
}

// Webhook da Evolution API
app.post('/webhook/evolution', async (req, res) => {
  try {
    const data = req.body;
    
    // Verificar se é mensagem recebida
    if (data.event !== 'messages.upsert') {
      return res.json({ ok: true });
    }
    
    const message = data.data?.message;
    const whatsapp = data.data?.key?.remoteJid?.replace('@s.whatsapp.net', '');
    const fromMe = data.data?.key?.fromMe; // Se é mensagem enviada por mim
    const messageType = message?.messageType || '';
    let text = message?.conversation || message?.extendedTextMessage?.text || '';
    
    // Ignorar mensagens enviadas por mim mesmo
    if (!whatsapp || fromMe) {
      return res.json({ ok: true });
    }
    
    // Ignorar mensagens de grupo
    if (whatsapp.includes('@g.us')) {
      return res.json({ ok: true });
    }
    
    // Verificar se é áudio
    if (message?.audioMessage || messageType === 'audioMessage' || messageType === 'ptt') {
      // Por enquanto, pedir texto
      const config = await loadConfig();
      if (config.evolution?.enabled) {
        await sendEvolutionMessage(whatsapp, 'Ops! Ainda não consigo ouvir áudios 😅 Pode mandar por texto?');
      }
      return res.json({ ok: true });
    }
    
    if (!text) {
      return res.json({ ok: true });
    }
    
    console.log(`📩 Mensagem de ${whatsapp}: ${text}`);
    
    // Ignorar mensagens de grupo
    if (whatsapp.includes('@g.us')) {
      return res.json({ ok: true });
    }
    
    // Buscar ou criar conversa
    const conversation = await getConversation(whatsapp);
    if (!conversation) {
      return res.json({ ok: true });
    }
    
    const messages = typeof conversation.messages === 'string' ? JSON.parse(conversation.messages) : conversation.messages;
    let name = conversation.name;
    let stage = conversation.stage;
    let interest = conversation.interest;
    
    // Salvar mensagem do usuário
    await saveMessage(whatsapp, 'user', text);
    
    // Extrair nome se mencionado
    const extractedName = extractName(text);
    if (extractedName && !name) {
      name = extractedName;
    }
    
    // Extrair interesse se mencionado
    const extractedInterest = extractInterest(text);
    if (extractedInterest) {
      interest = extractedInterest;
    }
    
    // Adicionar mensagem atual
    messages.push({ role: 'user', content: text });
    
    // Gerar resposta
    const response = await getAgentResponse(messages, whatsapp, name);
    
    // Se resposta for null (erro), não responder para evitar loop
    if (!response) {
      console.error('Gemini falhou, não respondendo para evitar loop');
      return res.json({ ok: true, error: 'gemini_failed' });
    }
    
    // Salvar resposta
    await saveMessage(whatsapp, 'assistant', response, name, interest, stage);
    
    // Enviar resposta
    const config = await loadConfig();
    if (config.evolution?.enabled) {
      await sendEvolutionMessage(whatsapp, response);
    }
    
    // Se capturou interesse e nome, salvar como lead
    if (name && interest) {
      await saveLead({
        id: whatsapp,
        name: name,
        phone: whatsapp,
        interest: interest,
        source: 'whatsapp_agent',
        createdAt: new Date().toISOString()
      });
      
      // Atualizar stage
      await saveMessage(whatsapp, 'system', 'Lead capturado', null, null, 'captured');
      
      // Notificar admin
      if (config.evolution?.enabled && config.whatsapp) {
        const leadMsg = `🆕 *Novo Lead Captado!*\n\n👤 Nome: ${name}\n📱 WhatsApp: ${whatsapp}\n💼 Interesse: ${interest}`;
        await sendEvolutionMessage(config.whatsapp, leadMsg);
      }
    }
    
    res.json({ ok: true, response });
  } catch (e) {
    console.error('Erro no webhook:', e.message);
    res.json({ ok: true });
  }
});

// Rota para ver conversas (admin)
app.get('/api/conversations', async (req, res) => {
  if (!useMySQL || !mysqlPool) {
    return res.json([]);
  }
  
  try {
    const [rows] = await mysqlPool.query(
      'SELECT id, whatsapp, name, stage, interest, created_at, updated_at FROM conversations ORDER BY updated_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (e) {
    res.json([]);
  }
});

// Rota para ver uma conversa
app.get('/api/conversations/:whatsapp', async (req, res) => {
  const conversation = await getConversation(req.params.whatsapp);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversa não encontrada' });
  }
  
  const messages = typeof conversation.messages === 'string' ? JSON.parse(conversation.messages) : conversation.messages;
  res.json({ ...conversation, messages });
});

// SPA Fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) {
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  } else {
    next();
  }
});

process.on('SIGTERM', () => { saveDB(); process.exit(0); });
app.listen(PORT, () => console.log(`Server running on port ${PORT} | DB: ${useMySQL ? 'MySQL' : 'JSON'}`));
