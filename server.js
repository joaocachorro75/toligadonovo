const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from the React build directory (dist)
const DIST_PATH = path.join(__dirname, 'dist');
app.use(express.static(DIST_PATH));

// Serve uploaded files
const UPLOADS_DIR = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// Data setup
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database_toligado.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- INITIAL DATA (Full Product List) ---
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
      fullDescription: 'Desenvolvemos Landing Pages otimizadas para conversão, com design moderno, carregamento ultrarrápido e copywriting persuasivo focado em transformar visitantes em clientes. Ideal para lançamentos, captura de leads e venda direta.',
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
      fullDescription: 'Automatize sua comunicação no WhatsApp. Envie mensagens em massa para grupos e contatos e tenha um atendente virtual 24 horas para não perder nenhuma venda. A ferramenta definitiva para escalar seu atendimento.',
      price: 199.90,
      heroImage: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&q=80&w=2000',
      features: ['Envio em Massa', 'Chatbot Inteligente', 'Gestão de Grupos', 'Relatórios de Envio'],
      ctaText: 'Automatizar Agora'
    },
    {
      id: '3',
      slug: 'lojas-virtuais',
      title: 'Lojas Virtuais Profissionais',
      menuTitle: 'Lojas Virtuais',
      shortDescription: 'E-commerce completo e profissional.',
      fullDescription: 'Tenha sua própria loja online profissional. Sistema completo de gestão de produtos, pedidos, pagamentos e entregas. Tudo pronto para você começar a faturar sem depender de marketplaces.',
      price: 1499.00,
      heroImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=2000',
      features: ['Painel de Gestão', 'Integração de Pagamento', 'Cálculo de Frete', 'Design Personalizado'],
      ctaText: 'Montar Minha Loja'
    },
    {
      id: '4',
      slug: 'blogs-ia',
      title: 'Blogs Automáticos com IA',
      menuTitle: 'Blogs IA',
      shortDescription: 'Conteúdo infinito gerado por inteligência artificial.',
      fullDescription: 'Mantenha seu site sempre atualizado e relevante no Google. Nosso sistema cria e posta artigos otimizados para SEO automaticamente utilizando o poder da IA. Ganhe autoridade sem escrever uma linha.',
      price: 89.90,
      heroImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2000',
      features: ['Postagens Diárias', 'SEO Automático', 'Imagens Geradas', 'Zero Esforço Manual'],
      ctaText: 'Ativar Blog Automático'
    },
    {
      id: '5',
      slug: 'sistema-delivery',
      title: 'Sistema de Delivery Completo',
      menuTitle: 'Delivery',
      shortDescription: 'Ideal para restaurantes, lanchonetes e pizzarias.',
      fullDescription: 'Receba pedidos diretamente no WhatsApp ou Painel, sem taxas abusivas de marketplaces. Cardápio digital interativo e gestão de entregas simplificada para modernizar seu restaurante.',
      price: 99.00,
      heroImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=2000',
      features: ['Cardápio Digital', 'Sem Taxas por Pedido', 'Impressão de Pedidos', 'Link Próprio'],
      ctaText: 'Digitalizar Restaurante'
    },
    {
      id: '6',
      slug: 'turbo-combo',
      title: 'Combinação Turbo: LP + Zap',
      menuTitle: 'Combo Turbo',
      shortDescription: 'A dupla perfeita para escalar suas vendas.',
      fullDescription: 'O poder da Landing Page para captar leads somado à automação do Zap Marketing para converter. A estratégia completa para quem quer resultados agressivos e imediatos.',
      price: 597.00,
      heroImage: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=2000',
      features: ['Landing Page Inclusa', '3 Meses de Zap Marketing', 'Configuração Completa', 'Treinamento de Uso'],
      ctaText: 'Quero o Combo'
    },
    {
      id: '7',
      slug: 'design-grafico',
      title: 'Design Gráfico e Identidade',
      menuTitle: 'Design',
      shortDescription: 'Logomarcas, banners e posts para redes sociais.',
      fullDescription: 'Destaque sua marca com um design profissional. Criamos sua identidade visual completa, posts para Instagram, banners para site e materiais impressos com qualidade de agência.',
      price: 150.00,
      heroImage: 'https://images.unsplash.com/photo-1626785774573-4b799312c95d?auto=format&fit=crop&q=80&w=2000',
      features: ['Design Exclusivo', 'Arquivos em Alta', 'Revisões Ilimitadas', 'Formatos Variados'],
      ctaText: 'Solicitar Design'
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
    if (!fileContent.trim()) throw new Error('Empty DB file');
    dbCache = JSON.parse(fileContent);
  } catch (e) {
    console.error("DB Corrupt, resetting.", e);
    try { fs.copyFileSync(DB_FILE, DB_FILE + '.bak.' + Date.now()); } catch(err) {}
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
  } catch (e) { console.error("Save failed", e); }
};

loadDB();

// --- Routes ---
app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/api/config', (req, res) => {
  const db = loadDB();
  if (!db.config) db.config = INITIAL_DATA.config;
  res.json(db.config);
});
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

app.get('/api/leads', (req, res) => res.json(loadDB().leads || []));
app.post('/api/leads', (req, res) => {
  const db = loadDB();
  if (!db.leads) db.leads = [];
  db.leads.unshift(req.body);
  saveDB();
  res.json({ success: true });
});
app.delete('/api/leads/:id', (req, res) => {
  const db = loadDB();
  if (db.leads) db.leads = db.leads.filter(l => l.id !== req.params.id);
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

app.get('/api/orders', (req, res) => res.json(loadDB().orders || []));
app.post('/api/orders', (req, res) => {
  const db = loadDB();
  if (!db.orders) db.orders = [];
  db.orders.unshift(req.body);
  saveDB();
  res.json({ success: true });
});
app.delete('/api/orders/:id', (req, res) => {
    const db = loadDB();
    if (db.orders) db.orders = db.orders.filter(o => o.id !== req.params.id);
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

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === 'admin' && pass === 'Naodigo2306@') {
    res.json({ success: true, token: 'valid-token-' + Date.now() });
  } else {
    res.status(401).json({ success: false });
  }
});

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

process.on('SIGTERM', () => { saveDB(); process.exit(0); });
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));