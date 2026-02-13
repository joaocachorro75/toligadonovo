
// FIX: Disable SSL verification for internal Docker communication (EasyPanel/Coolify)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

// Robust Fetch Import: Tries node-fetch first (better for Docker), falls back to native
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
    pix: { keyType: 'email', key: 'contato@to-ligado.com', beneficiary: 'To-Ligado Soluções' },
    home: {
      heroTitle: 'Sua Empresa',
      heroHighlight: 'No Futuro Agora',
      heroDescription: 'Desenvolvemos sites de alta performance, automações de marketing e soluções com IA para escalar o seu negócio. Tudo pronto, hospedado e otimizado para vendas.',
      servicesTitle: 'Nossas Soluções',
      servicesDescription: 'Tecnologia de ponta envelopada em produtos simples de contratar e usar.',
      contactTitle: 'Pronto para o próximo nível?',
      contactDescription: 'Não deixe sua empresa parada no tempo. A tecnologia avança rápido, e nós ajudamos você a liderar o mercado.'
    },
    evolution: {
        enabled: false,
        baseUrl: 'https://api.evolution-api.com',
        instanceName: 'minha-instancia',
        apiKey: '',
        welcomeMessage: 'Olá! Recebemos seu pedido de *{produto}*. Para ativar, realize o pagamento via PIX.',
        reminderMessage: 'Olá *{cliente}*! Lembrete de renovação da sua assinatura *{produto}*. O vencimento é hoje.'
    }
  },
  products: [
    {
        id: '8',
        slug: 'tv-cine-box',
        title: 'TV Cine Box 4K',
        menuTitle: 'TV Online',
        shortDescription: 'Todos os canais, filmes e séries em um só lugar.',
        fullDescription: 'Transforme sua TV, Celular ou Computador em um cinema completo. Tenha acesso a mais de 2.000 canais ao vivo, incluindo esportes, notícias, infantis e adultos (opcional), além de um catálogo on-demand com mais de 10.000 filmes e séries atualizados diariamente. Sem antenas, sem cabos, basta internet.',
        price: 35.00,
        paymentType: 'recurring',
        billingCycle: 'monthly',
        heroImage: 'https://images.unsplash.com/photo-1593784653277-226e3c6a4696?auto=format&fit=crop&q=80&w=2000',
        features: ['+2000 Canais Ao Vivo', 'Filmes e Séries (Netflix, Prime, etc)', 'Qualidade 4K/FHD', 'Sem travamentos (CDN Dedicada)', 'Teste Grátis de 4 horas'],
        ctaText: 'Assinar Agora'
      },
    {
      id: '1',
      slug: 'landing-pages',
      title: 'Landing Pages de Alta Conversão',
      menuTitle: 'Landing Pages',
      shortDescription: 'Páginas que captam leads e vendem sozinhas.',
      fullDescription: 'Desenvolvemos Landing Pages otimizadas para conversão, com design moderno, carregamento ultrarrápido e copywriting persuasivo focado em transformar visitantes em clientes. Ideal para lançamentos, captura de leads e venda direta.',
      price: 497.00,
      paymentType: 'one-time',
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
      paymentType: 'recurring',
      billingCycle: 'monthly',
      setupFee: 0,
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
      price: 149.90,
      paymentType: 'recurring',
      billingCycle: 'monthly',
      setupFee: 997.00,
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
      paymentType: 'recurring',
      billingCycle: 'monthly',
      setupFee: 0,
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
      paymentType: 'recurring',
      billingCycle: 'monthly',
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
      paymentType: 'one-time',
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
      paymentType: 'one-time',
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
    console.log("Database file not found. Creating new one...");
    dbCache = JSON.parse(JSON.stringify(INITIAL_DATA));
    saveDB();
    return dbCache;
  }
  try {
    const fileContent = fs.readFileSync(DB_FILE, 'utf8');
    if (!fileContent.trim()) throw new Error('Empty DB file');
    dbCache = JSON.parse(fileContent);
    
    // Integrity Checks
    let modified = false;
    if (!dbCache.posts || dbCache.posts.length === 0) {
       console.log("Populating initial blog posts...");
       dbCache.posts = INITIAL_DATA.posts;
       modified = true;
    }
    if (!dbCache.products || dbCache.products.length === 0) {
        dbCache.products = INITIAL_DATA.products;
        modified = true;
    }
    if (!dbCache.config.evolution) {
        dbCache.config.evolution = INITIAL_DATA.config.evolution;
        modified = true;
    }
    
    if (modified) saveDB();

  } catch (e) {
    console.error("DB Corrupt or Empty, resetting.", e);
    try { fs.copyFileSync(DB_FILE, DB_FILE + '.bak.' + Date.now()); } catch(err) {}
    dbCache = JSON.parse(JSON.stringify(INITIAL_DATA));
    saveDB();
  }
  return dbCache;
};

const saveDB = () => {
  if (!dbCache) return;
  try {
    // Write to a temp file first to avoid corruption on crash
    const tempFile = DB_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(dbCache, null, 2));
    fs.renameSync(tempFile, DB_FILE);
    console.log(`[${new Date().toLocaleTimeString()}] Database successfully saved to disk.`);
  } catch (e) { 
    console.error("CRITICAL: Failed to save database to disk:", e); 
  }
};

// Load initially
loadDB();

// --- EVOLUTION API HELPER ---
const sendEvolutionMessage = async (to, text) => {
    const db = loadDB();
    const config = db.config.evolution;
    
    if (!config || !config.enabled) {
        console.log(`[Evolution API] Aborted: Integration is DISABLED in settings.`);
        return false;
    }
    
    if (!config.baseUrl || !config.apiKey) {
        console.log("Evolution API not configured.");
        return false;
    }

    const apiKey = (config.apiKey || '').trim();
    const instanceName = (config.instanceName || '').trim();
    let baseUrl = (config.baseUrl || '').trim().replace(/\/$/, '');
    
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;

    // Clean number (keep only digits)
    const number = to.replace(/\D/g, '');
    const url = `${baseUrl}/message/sendText/${instanceName}`;

    console.log(`Attempting to send message via Evolution API to ${number}...`);

    try {
        const body = {
            number: number,
            text: text,
            delay: 1200,
            linkPreview: true
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey // Standard Evolution v2 Instance Header
            },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            console.log(`WhatsApp sent to ${number}`);
            return true;
        } else {
            console.error("Evolution API Error:", await response.text());
            return false;
        }
    } catch (e) {
        console.error("Failed to send Evolution message:", e.message);
        if(e.cause) console.error("Cause:", e.cause);
        return false;
    }
};

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

// Products
app.get('/api/products', (req, res) => res.json(loadDB().products || []));
app.post('/api/products', (req, res) => {
  const db = loadDB();
  db.products = req.body;
  saveDB();
  res.json({ success: true });
});

// Blog Posts
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

// Leads
app.get('/api/leads', (req, res) => res.json(loadDB().leads || []));
app.post('/api/leads', (req, res) => {
  const db = loadDB();
  if (!db.leads) db.leads = [];
  
  const newLead = req.body;
  db.leads.unshift(newLead);
  saveDB();

  // Notify Admin about Lead
  const evoConfig = db.config.evolution;
  const adminPhone = db.config.whatsapp;
  if (evoConfig && evoConfig.enabled && adminPhone) {
      const msg = `🎯 *NOVO LEAD CAPTURADO!* 🎯\n\n` + 
                  `👤 *Nome:* ${newLead.name}\n` +
                  `📱 *Zap:* ${newLead.whatsapp}\n` +
                  `📍 *Origem:* ${newLead.originPage}`;
      sendEvolutionMessage(adminPhone, msg);
  }

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

// Orders & Recurring Logic
app.get('/api/orders', (req, res) => res.json(loadDB().orders || []));
app.post('/api/orders', async (req, res) => {
  const db = loadDB();
  if (!db.orders) db.orders = [];
  
  const newOrder = req.body;
  db.orders.unshift(newOrder);
  saveDB();

  // Trigger Automatic Messages
  const evoConfig = db.config.evolution;
  if (evoConfig && evoConfig.enabled) {
      // 1. Send to Customer
      if (newOrder.customerWhatsapp) {
        let msg = evoConfig.welcomeMessage
            .replace('{cliente}', newOrder.customerName)
            .replace('{produto}', newOrder.productTitle);
        
        sendEvolutionMessage(newOrder.customerWhatsapp, msg);
      }

      // 2. Send to Admin
      const adminPhone = db.config.whatsapp;
      if (adminPhone) {
          const typeLabel = newOrder.isSubscription ? 'Assinatura (Recorrente)' : 'Pagamento Único';
          const adminMsg = `🔔 *NOVA VENDA REALIZADA!* 💲\n\n` +
                           `👤 *Cliente:* ${newOrder.customerName}\n` +
                           `📱 *WhatsApp:* ${newOrder.customerWhatsapp}\n` +
                           `📦 *Produto:* ${newOrder.productTitle}\n` +
                           `💰 *Valor:* R$ ${newOrder.productPrice}\n` +
                           `🔄 *Tipo:* ${typeLabel}\n\n` +
                           `Acesse o painel para gerenciar.`;
          
          sendEvolutionMessage(adminPhone, adminMsg);
      }
  }

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

// Manual Payment Reminder Trigger
app.post('/api/orders/:id/remind', async (req, res) => {
    const db = loadDB();
    const order = db.orders.find(o => o.id === req.params.id);
    
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (!order.customerWhatsapp) return res.status(400).json({ error: "No whatsapp" });

    const evoConfig = db.config.evolution;
    let msg = evoConfig.reminderMessage || "Olá, lembrete de pagamento.";
    
    msg = msg
        .replace('{cliente}', order.customerName)
        .replace('{produto}', order.productTitle);
    
    const sent = await sendEvolutionMessage(order.customerWhatsapp, msg);
    
    if (sent) res.json({ success: true });
    else res.status(500).json({ error: "Failed to send message" });
});

// Test Evolution API
app.post('/api/evolution/test', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone is required' });
  
  const success = await sendEvolutionMessage(phone, "🔔 *Teste de Conexão:*\n\nSeu sistema To-Ligado.com está conectado corretamente à Evolution API! 🚀");
  
  if (success) res.json({ success: true });
  else res.status(500).json({ error: 'Failed to send message' });
});

// Check Evolution Status
app.get('/api/evolution/status', async (req, res) => {
    const db = loadDB();
    const config = db.config.evolution;

    if (!config || !config.baseUrl || !config.instanceName) {
        return res.json({ status: 'not_configured' });
    }

    try {
        const apiKey = (config.apiKey || '').trim();
        const instanceName = (config.instanceName || '').trim();
        let baseUrl = (config.baseUrl || '').trim().replace(/\/$/, '');
        
        // Only prepend https if http is not present. Do not force https if user typed http.
        if (!baseUrl.startsWith('http')) {
             baseUrl = 'https://' + baseUrl;
        }
        
        const url = `${baseUrl}/instance/connectionState/${instanceName}`;
        console.log(`Checking status at: ${url}`);

        const response = await fetch(url, {
            headers: { 'apikey': apiKey }
        });
        
        if (response.ok) {
            const data = await response.json();
            const state = data?.instance?.state || data?.state || 'unknown';
            res.json({ status: state, raw: data });
        } else {
            const errorText = await response.text();
            
            // SPECIFIC 401 DEBUGGING
            if (response.status === 401) {
                console.error(`[Evolution API] 401 UNAUTHORIZED at ${url}`);
                console.error(`[Evolution API] Headers sent: { apikey: "${apiKey.substring(0, 5)}***" }`);
                console.error(`[Evolution API] Verify if instance '${instanceName}' exists and if the key is correct.`);
            } else {
                console.error("Evolution Status Error:", errorText);
            }
            
            res.json({ status: 'error', details: errorText, code: response.status });
        }
    } catch (e) {
        console.error("Evolution Status Check Failed:", e.message);
        if (e.cause) console.error("Cause:", e.cause);
        res.json({ status: 'error', details: e.message + (e.cause ? ` (${e.cause.code})` : '') });
    }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.post('/api/login', (req, res) => {
  try {
    const { user, pass } = req.body || {};
    const safeUser = (user || '').trim();
    const safePass = (pass || '').trim();
    
    if (
        (safeUser === 'admin' && safePass === 'Naodigo2306@') || 
        (safeUser === 'admin' && safePass === 'admin')
    ) {
      res.json({ success: true, token: 'valid-token-' + Date.now() });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: "Server error" });
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
