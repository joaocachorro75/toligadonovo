const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
// Serve static files from the React build directory (dist)
app.use(express.static(path.join(__dirname, 'dist')));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Data & Uploads setup
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer Config for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Initial Data (Embedded to avoid import issues in Node environment)
const INITIAL_DATA = {
  config: {
    logoText: 'To-Ligado.com',
    logoColor: '#06b6d4',
    whatsapp: '5591980124904',
    pix: { keyType: 'email', key: 'contato@to-ligado.com', beneficiary: 'To-Ligado Soluções' },
    home: {
      heroTitle: 'Sua Empresa',
      heroHighlight: 'No Futuro Agora',
      heroDescription: 'Desenvolvemos sites de alta performance, automações de marketing e soluções com IA para escalar o seu negócio. Tudo pronto, hospedado e otimizado para vendas.',
      servicesTitle: 'Nossas Soluções',
      servicesDescription: 'Tecnologia de ponta envelopada em produtos simples de contratar e usar.',
      contactTitle: 'Pronto para o próximo nível?',
      contactDescription: 'Não deixe sua empresa parada no tempo. A tecnologia avança rápido, e nós ajudamos você a liderar o mercado.'
    }
  },
  products: [
    {
      id: '1',
      slug: 'landing-pages',
      title: 'Landing Pages de Alta Conversão',
      menuTitle: 'Landing Pages',
      shortDescription: 'Páginas que captam leads e vendem sozinhas.',
      fullDescription: 'Desenvolvemos Landing Pages otimizadas para conversão, com design moderno, carregamento ultrarrápido e copywriting persuasivo focado em transformar visitantes em clientes.',
      price: 497.00,
      heroImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2000',
      features: ['Design Responsivo', 'Alta Velocidade', 'Integração com WhatsApp', 'SEO Otimizado'],
      ctaText: 'Quero Vender Mais'
    },
    {
      id: '2',
      slug: 'zap-marketing',
      title: 'Zap Marketing + Atendente 24h',
      menuTitle: 'Zap Marketing',
      shortDescription: 'Plataforma de envio em massa e atendimento automático.',
      fullDescription: 'Automatize sua comunicação no WhatsApp. Envie mensagens em massa para grupos e contatos e tenha um atendente virtual 24 horas para não perder nenhuma venda.',
      price: 199.90,
      heroImage: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&q=80&w=2000',
      features: ['Envio em Massa', 'Chatbot Inteligente', 'Gestão de Grupos', 'Relatórios de Envio'],
      ctaText: 'Automatizar Agora'
    }
  ],
  leads: [],
  orders: []
};

// Database Helpers
const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2));
    return INITIAL_DATA;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error("Error reading DB, resetting:", e);
    return INITIAL_DATA;
  }
};

const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- API ROUTES ---

// Config
app.get('/api/config', (req, res) => {
  const db = readDB();
  // Ensure structure exists if DB is old
  if (!db.config) db.config = INITIAL_DATA.config;
  res.json(db.config);
});
app.post('/api/config', (req, res) => {
  const db = readDB();
  db.config = req.body;
  writeDB(db);
  res.json({ success: true });
});

// Products
app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products || []);
});
app.post('/api/products', (req, res) => {
  const db = readDB();
  db.products = req.body; 
  writeDB(db);
  res.json({ success: true });
});

// Leads
app.get('/api/leads', (req, res) => {
  const db = readDB();
  res.json(db.leads || []);
});
app.post('/api/leads', (req, res) => {
  const db = readDB();
  if (!db.leads) db.leads = [];
  db.leads.unshift(req.body);
  writeDB(db);
  res.json({ success: true });
});
app.delete('/api/leads/:id', (req, res) => {
  const db = readDB();
  if (db.leads) {
    db.leads = db.leads.filter(l => l.id !== req.params.id);
    writeDB(db);
  }
  res.json({ success: true });
});
app.put('/api/leads/:id', (req, res) => {
  const db = readDB();
  if (db.leads) {
    const index = db.leads.findIndex(l => l.id === req.params.id);
    if (index !== -1) {
      db.leads[index] = req.body;
      writeDB(db);
    }
  }
  res.json({ success: true });
});

// Orders
app.get('/api/orders', (req, res) => {
  const db = readDB();
  res.json(db.orders || []);
});
app.post('/api/orders', (req, res) => {
  const db = readDB();
  if (!db.orders) db.orders = [];
  db.orders.unshift(req.body);
  writeDB(db);
  res.json({ success: true });
});
app.delete('/api/orders/:id', (req, res) => {
  const db = readDB();
  if (db.orders) {
    db.orders = db.orders.filter(o => o.id !== req.params.id);
    writeDB(db);
  }
  res.json({ success: true });
});
app.put('/api/orders/:id', (req, res) => {
  const db = readDB();
  if (db.orders) {
    const index = db.orders.findIndex(o => o.id === req.params.id);
    if (index !== -1) {
      db.orders[index] = req.body;
      writeDB(db);
    }
  }
  res.json({ success: true });
});

// Upload
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Return the relative URL to the uploaded file
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Auth (Simple hardcoded for now)
app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  // NOTE: In a real app, use environment variables or a secure hash
  if (user === 'admin' && pass === 'Naodigo2306@') {
    res.json({ success: true, token: 'valid-token-' + Date.now() });
  } else {
    res.status(401).json({ success: false });
  }
});

// Catch-all for React Router (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});