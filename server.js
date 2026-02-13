
// FIX: Disable SSL verification for internal Docker communication (EasyPanel/Coolify)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

// Robust Fetch Import
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args)).catch(() => global.fetch(...args));

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

// --- INITIAL DATA ---
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
        fullDescription: 'Transforme sua TV, Celular ou Computador em um cinema completo.',
        price: 35.00,
        paymentType: 'recurring',
        billingCycle: 'monthly',
        heroImage: 'https://images.unsplash.com/photo-1593784653277-226e3c6a4696?auto=format&fit=crop&q=80&w=2000',
        features: ['+2000 Canais Ao Vivo', 'Filmes e Séries', 'Qualidade 4K'],
        ctaText: 'Assinar Agora'
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
    }
  ],
  leads: [],
  orders: []
};

// --- DB Handling ---
let dbCache = null;

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
    // Se os posts não existirem ou estiverem vazios, recarrega os padrões
    if (!dbCache.posts || dbCache.posts.length === 0) {
       dbCache.posts = INITIAL_DATA.posts;
       modified = true;
    }
    if (!dbCache.products || dbCache.products.length === 0) {
        dbCache.products = INITIAL_DATA.products;
        modified = true;
    }
    if (!dbCache.config.adminPassword) {
        dbCache.config.adminPassword = INITIAL_DATA.config.adminPassword;
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
    const db = loadDB();
    const config = db.config.evolution;
    if (!config || !config.enabled || !config.baseUrl || !config.apiKey) return false;

    const apiKey = (config.apiKey || '').trim();
    const instanceName = (config.instanceName || '').trim();
    let baseUrl = (config.baseUrl || '').trim().replace(/\/$/, '');
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
app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/api/config', (req, res) => res.json(loadDB().config));
app.post('/api/config', (req, res) => {
  const db = loadDB();
  db.config = req.body;
  saveDB();
  res.json({ success: true });
});

app.get('/api/products', (req, res) => res.json(loadDB().products || []));
app.post('/api/products', (req, res) => {
  const db = loadDB();
  db.products = req.body;
  saveDB();
  res.json({ success: true });
});

app.get('/api/posts', (req, res) => res.json(loadDB().posts || []));
app.post('/api/posts', (req, res) => {
  const db = loadDB();
  if (!db.posts) db.posts = [];
  db.posts.unshift(req.body);
  saveDB();
  res.json({ success: true });
});
app.put('/api/posts/:id', (req, res) => {
  const db = loadDB();
  if (db.posts) {
    const index = db.posts.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
      db.posts[index] = req.body;
      saveDB();
    }
  }
  res.json({ success: true });
});
app.delete('/api/posts/:id', (req, res) => {
  const db = loadDB();
  if (db.posts) {
    db.posts = db.posts.filter(p => p.id !== req.params.id);
    saveDB();
  }
  res.json({ success: true });
});

// Evolution API Routes
app.get('/api/evolution/status', async (req, res) => {
  const db = loadDB();
  const config = db.config.evolution;
  if (!config || !config.baseUrl || !config.apiKey) {
    return res.json({ status: 'error', details: 'Configuração incompleta' });
  }

  const apiKey = (config.apiKey || '').trim();
  const instanceName = (config.instanceName || '').trim();
  let baseUrl = (config.baseUrl || '').trim().replace(/\/$/, '');
  if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;

  const url = `${baseUrl}/instance/connectionStatus/${instanceName}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'apikey': apiKey }
    });
    const data = await response.json();
    const state = data.instance?.state || data.status || 'close';
    res.json({ status: state === 'open' ? 'open' : 'close', details: data.message, code: response.status });
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
  const db = loadDB();
  const order = db.orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ success: false, error: 'Pedido não encontrado' });

  const message = (db.config.evolution?.reminderMessage || 'Lembrete de pagamento')
    .replace('{cliente}', order.customerName)
    .replace('{produto}', order.productTitle);

  const success = await sendEvolutionMessage(order.customerWhatsapp, message);
  res.json({ success });
});

// Lead Routes (PUT and DELETE)
app.get('/api/leads', (req, res) => res.json(loadDB().leads || []));
app.post('/api/leads', (req, res) => {
  const db = loadDB();
  if (!db.leads) db.leads = [];
  db.leads.unshift(req.body);
  saveDB();
  res.json({ success: true });
});
app.put('/api/leads/:id', (req, res) => {
  const db = loadDB();
  if (db.leads) {
    const index = db.leads.findIndex(l => l.id === req.params.id);
    if (index !== -1) {
      db.leads[index] = req.body;
      saveDB();
    }
  }
  res.json({ success: true });
});
app.delete('/api/leads/:id', (req, res) => {
  const db = loadDB();
  if (db.leads) {
    db.leads = db.leads.filter(l => l.id !== req.params.id);
    saveDB();
  }
  res.json({ success: true });
});

// Order Routes (PUT and DELETE)
app.get('/api/orders', (req, res) => res.json(loadDB().orders || []));
app.post('/api/orders', async (req, res) => {
  const db = loadDB();
  if (!db.orders) db.orders = [];
  db.orders.unshift(req.body);
  saveDB();
  res.json({ success: true });
});
app.put('/api/orders/:id', (req, res) => {
  const db = loadDB();
  if (db.orders) {
    const index = db.orders.findIndex(o => o.id === req.params.id);
    if (index !== -1) {
      db.orders[index] = req.body;
      saveDB();
    }
  }
  res.json({ success: true });
});
app.delete('/api/orders/:id', (req, res) => {
  const db = loadDB();
  if (db.orders) {
    db.orders = db.orders.filter(o => o.id !== req.params.id);
    saveDB();
  }
  res.json({ success: true });
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.post('/api/login', (req, res) => {
  const { user, pass } = req.body || {};
  const db = loadDB();
  const currentPassword = db.config?.adminPassword || 'admin123';
  if (user === 'admin' && pass === currentPassword) {
    res.json({ success: true, token: 'valid-token-' + Date.now() });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
