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

// ============================================
// SISTEMA DE RENOVAÇÕES E LEMBRETES
// ============================================

// NOTA: Função checkSubscriptions movida para depois das funções auxiliares

// ============================================
// FIM DO SISTEMA DE RENOVAÇÕES
// ============================================

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
  host: process.env.MYSQL_HOST || process.env.DB_HOST || null,
  port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306'),
  user: process.env.MYSQL_USER || process.env.DB_USER || null,
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || null,
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || null
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
  )`,
  `CREATE TABLE IF NOT EXISTS agent_instructions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    keywords TEXT,
    content TEXT NOT NULL,
    priority INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    instance_name VARCHAR(100) UNIQUE,
    instance_status VARCHAR(50) DEFAULT 'pending',
    instance_qrcode TEXT,
    webhook_url VARCHAR(500),
    agent_prompt TEXT,
    agent_active BOOLEAN DEFAULT true,
    plan VARCHAR(50) DEFAULT 'basic',
    monthly_price DECIMAL(10,2) DEFAULT 99.90,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    evolution_api_url VARCHAR(500),
    evolution_api_key VARCHAR(255),
    evolution_webhook_url VARCHAR(500),
    modal_api_key VARCHAR(255),
    groq_api_key VARCHAR(255),
    elevenlabs_api_key VARCHAR(255),
    elevenlabs_voice_id VARCHAR(100)
  )`,
  // TABELA DE INSTRUÇÕES DINÂMICAS PARA O LIGADINHO
  `CREATE TABLE IF NOT EXISTS ligadinho_instructions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category ENUM('suporte', 'vendas', 'procedimento', 'tutorial', 'faq', 'produto') NOT NULL,
    title VARCHAR(255) NOT NULL,
    keywords VARCHAR(500),
    instruction TEXT NOT NULL,
    step_by_step TEXT,
    product_slug VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_product (product_slug),
    INDEX idx_active (is_active)
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
    ligadinhoPaused: false,
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
        enabled: true,
        baseUrl: 'https://automacao-evolution-api.nfeujb.easypanel.host',
        instanceName: 'toligado',
        apiKey: '5BE128D18942-4B09-8AF8-454ADEEB06B1',
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
    },
    {
      id: '9',
      slug: 'pdvcel',
      title: 'PdvCel - PDV Mobile',
      menuTitle: 'PDV Mobile',
      shortDescription: 'Sistema de PDV 100% mobile para lojas e ambulantes.',
      fullDescription: 'Sistema completo de ponto de venda no celular. Ideal para mercadinhos, lanchonetes, salões e ambulantes. Gerencie vendas, estoque e histórico no palm da sua mão!',
      price: 29.00,
      paymentType: 'recurring',
      billingCycle: 'monthly',
      heroImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=2000',
      features: ['100% Mobile', 'Controle de Estoque', 'Histórico de Vendas', '2 dias grátis'],
      ctaText: 'Começar Grátis'
    },
    {
      id: '10',
      slug: 'funcionarios-ia',
      title: 'Funcionários IA - Equipe Virtual 24h',
      menuTitle: 'Funcionários IA',
      shortDescription: 'Equipe virtual que trabalha 24h: atendentes, vendedores, secretárias e mais!',
      fullDescription: 'Contrate funcionários de IA que trabalham 24h por dia, sem férias e sem salário! Atendentes, vendedores, secretárias, assistentes de agendamento e muito mais. Todos treinados para o seu negócio e integrados com WhatsApp.',
      price: 149.00,
      paymentType: 'recurring',
      billingCycle: 'monthly',
      heroImage: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&q=80&w=2000',
      features: ['24 tipos de funcionários', 'Atendimento 24h', 'Integração WhatsApp', 'Treinado para seu negócio'],
      ctaText: 'Contratar Funcionários'
    },
    {
      id: '11',
      slug: 'maisquecardapio',
      title: 'Mais que Cardápio - Cardápio Digital',
      menuTitle: 'Cardápio Digital',
      shortDescription: 'Cardápio digital com QR Code, delivery e IA.',
      fullDescription: 'Transforme seu restaurante com cardápio digital via QR Code! Pedidos direto no WhatsApp, gestão de mesas, delivery com taxas por bairro e IA que sugere melhorias no cardápio.',
      price: 49.00,
      paymentType: 'recurring',
      billingCycle: 'monthly',
      heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34b4?auto=format&fit=crop&q=80&w=2000',
      features: ['QR Code nas mesas', 'Delivery integrado', 'IA para sugestões', 'Reservas online'],
      ctaText: 'Criar Cardápio'
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
      for (const product of products) {
        await mysqlPool.query(
          'INSERT INTO products (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
          [product.id, JSON.stringify(product)]
        );
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

// ============================================
// INSTRUÇÕES DO AGENTE (DINÂMICAS)
// ============================================

// Carregar instruções ativas
async function loadAgentInstructions() {
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query(
        'SELECT * FROM agent_instructions WHERE active = true ORDER BY priority DESC, category, title'
      );
      return rows;
    } catch (e) {
      console.error('Erro ao carregar instruções MySQL:', e.message);
      return [];
    }
  }
  // Fallback JSON
  return loadDB().agentInstructions || [];
}

// Carregar todas as instruções (admin)
async function loadAllInstructions() {
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query(
        'SELECT * FROM agent_instructions ORDER BY category, priority DESC, title'
      );
      return rows;
    } catch (e) {
      console.error('Erro ao carregar instruções MySQL:', e.message);
      return [];
    }
  }
  return loadDB().agentInstructions || [];
}

// Salvar instrução
async function saveInstruction(instruction) {
  if (useMySQL && mysqlPool) {
    try {
      if (instruction.id) {
        await mysqlPool.query(
          `UPDATE agent_instructions SET category = ?, title = ?, keywords = ?, content = ?, priority = ?, active = ? WHERE id = ?`,
          [instruction.category, instruction.title, instruction.keywords, instruction.content, instruction.priority || 0, instruction.active !== false, instruction.id]
        );
      } else {
        const [result] = await mysqlPool.query(
          `INSERT INTO agent_instructions (category, title, keywords, content, priority, active) VALUES (?, ?, ?, ?, ?, ?)`,
          [instruction.category, instruction.title, instruction.keywords, instruction.content, instruction.priority || 0, instruction.active !== false]
        );
        instruction.id = result.insertId;
      }
      return instruction;
    } catch (e) {
      console.error('Erro ao salvar instrução MySQL:', e.message);
      return null;
    }
  }
  // Fallback JSON
  const db = loadDB();
  if (!db.agentInstructions) db.agentInstructions = [];
  if (!instruction.id) instruction.id = Date.now();
  const index = db.agentInstructions.findIndex(i => i.id === instruction.id);
  if (index >= 0) db.agentInstructions[index] = instruction;
  else db.agentInstructions.push(instruction);
  saveDB();
  return instruction;
}

// Deletar instrução
async function deleteInstruction(id) {
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM agent_instructions WHERE id = ?', [id]);
      return true;
    } catch (e) {
      console.error('Erro ao deletar instrução MySQL:', e.message);
      return false;
    }
  }
  const db = loadDB();
  db.agentInstructions = (db.agentInstructions || []).filter(i => i.id !== id);
  saveDB();
  return true;
}

// Buscar instruções por palavras-chave
async function findRelevantInstructions(message) {
  const instructions = await loadAgentInstructions();
  const lowerMessage = message.toLowerCase();
  
  return instructions.filter(inst => {
    if (!inst.keywords) return false;
    const keywords = inst.keywords.toLowerCase().split(',').map(k => k.trim());
    return keywords.some(k => lowerMessage.includes(k));
  });
}

// ============================================
// FIM INSTRUÇÕES DO AGENTE
// ============================================

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

// Debug endpoint para verificar configuração MySQL
app.get('/debug-mysql', (req, res) => {
  res.json({
    useMySQL: useMySQL,
    mysqlConfigured: !!(MYSQL_CONFIG.host && MYSQL_CONFIG.user && MYSQL_CONFIG.database),
    config: {
      host: MYSQL_CONFIG.host || 'não configurado',
      user: MYSQL_CONFIG.user || 'não configurado',
      database: MYSQL_CONFIG.database || 'não configurado',
      port: MYSQL_CONFIG.port
    },
    env: {
      DB_HOST: process.env.DB_HOST ? 'definido' : 'não definido',
      DB_USER: process.env.DB_USER ? 'definido' : 'não definido',
      DB_PASSWORD: process.env.DB_PASSWORD ? 'definido' : 'não definido',
      DB_NAME: process.env.DB_NAME ? 'definido' : 'não definido',
      MYSQL_HOST: process.env.MYSQL_HOST ? 'definido' : 'não definido',
      MYSQL_USER: process.env.MYSQL_USER ? 'definido' : 'não definido',
      MYSQL_DATABASE: process.env.MYSQL_DATABASE ? 'definido' : 'não definido'
    }
  });
});

// Debug: Ver produtos no banco
app.get('/debug-products', async (req, res) => {
  try {
    if (useMySQL && mysqlPool) {
      const [rows] = await mysqlPool.query('SELECT id, data FROM products');
      res.json({ 
        source: 'MySQL',
        count: rows.length,
        products: rows.map(r => ({ id: r.id, ...JSON.parse(r.data) }))
      });
    } else {
      res.json({ source: 'JSON', products: loadDB().products || [] });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/config', async (req, res) => res.json(await loadConfig()));

app.post('/api/config', async (req, res) => {
  await saveConfig(req.body);
  res.json({ success: true });
});

// Ligadinho pause/resume
app.get('/api/ligadinho/status', async (req, res) => {
  const config = await loadConfig();
  res.json({ 
    paused: config.ligadinhoPaused || false,
    status: config.ligadinhoPaused ? 'paused' : 'active'
  });
});

app.post('/api/ligadinho/pause', async (req, res) => {
  const config = await loadConfig();
  config.ligadinhoPaused = true;
  await saveConfig(config);
  res.json({ success: true, status: 'paused', message: 'Ligadinho pausado!' });
});

app.post('/api/ligadinho/resume', async (req, res) => {
  const config = await loadConfig();
  config.ligadinhoPaused = false;
  await saveConfig(config);
  res.json({ success: true, status: 'active', message: 'Ligadinho ativo!' });
});

app.get('/api/products', async (req, res) => res.json(await loadProducts()));

app.post('/api/products', async (req, res) => {
  // Aceita tanto array quanto objeto único
  const products = Array.isArray(req.body) ? req.body : [req.body];
  await saveProducts(products);
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

// ============================================
// INSTRUÇÕES DO AGENTE - ENDPOINTS
// ============================================

// Listar todas as instruções (admin)
app.get('/api/instructions', async (req, res) => {
  res.json(await loadAllInstructions());
});

// Listar instruções ativas (para o agente)
app.get('/api/instructions/active', async (req, res) => {
  res.json(await loadAgentInstructions());
});

// Buscar instruções relevantes por mensagem
app.post('/api/instructions/search', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message é obrigatório' });
  res.json(await findRelevantInstructions(message));
});

// Criar/atualizar instrução
app.post('/api/instructions', async (req, res) => {
  const instruction = await saveInstruction(req.body);
  if (instruction) {
    res.json({ success: true, instruction });
  } else {
    res.status(500).json({ error: 'Erro ao salvar instrução' });
  }
});

// Atualizar instrução
app.put('/api/instructions/:id', async (req, res) => {
  req.body.id = req.params.id;
  const instruction = await saveInstruction(req.body);
  if (instruction) {
    res.json({ success: true, instruction });
  } else {
    res.status(500).json({ error: 'Erro ao atualizar instrução' });
  }
});

// Deletar instrução
app.delete('/api/instructions/:id', async (req, res) => {
  const success = await deleteInstruction(req.params.id);
  res.json({ success });
});

// ============================================
// FIM INSTRUÇÕES DO AGENTE
// ============================================

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
  
  // Adicionar data de criação e vencimento para assinaturas
  order.createdAt = Date.now();
  if (order.isSubscription) {
    // Vencimento em 30 dias para mensal, 365 para anual
    const days = order.billingCycle === 'yearly' ? 365 : 30;
    order.dueDate = Date.now() + (days * 24 * 60 * 60 * 1000);
    order.subscriptionStatus = 'active';
  }
  
  await saveOrder(order);
  
  const config = await loadConfig();
  
  // Integração com SaaS (PdvCel e Agentes IA)
  let saasAccount = null;
  
  // PdvCel - PDV Mobile
  if (order.productSlug === 'pdvcel' || order.productTitle?.toLowerCase().includes('pdv')) {
    try {
      const pdvcelRes = await fetch('https://pdvcel.to-ligado.com/api/sync/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: order,
          apiKey: 'toligado_sync_2026'
        })
      });
      if (pdvcelRes.ok) {
        const data = await pdvcelRes.json();
        saasAccount = {
          type: 'pdvcel',
          url: 'https://pdvcel.to-ligado.com',
          login: order.customerWhatsapp,
          password: 'mudar123',
          tenantId: data.tenantId
        };
      }
    } catch (e) {
      console.error('Erro ao criar conta PdvCel:', e);
    }
  }
  
  // Funcionários IA - WhatsApp
  if (order.productSlug === 'agente-ia-whatsapp' || order.productSlug === 'funcionarios-ia' || order.productTitle?.toLowerCase().includes('agente') || order.productTitle?.toLowerCase().includes('funcionário')) {
    try {
      // Criar cliente no SaaS Funcionários IA via sync/order (mesmo padrão do PDVCel)
      const funcionariosRes = await fetch('https://funcionariosia.to-ligado.com/api/sync/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: order,
          apiKey: 'toligado_sync_2026'
        })
      });
      if (funcionariosRes.ok) {
        const data = await funcionariosRes.json();
        saasAccount = {
          type: 'funcionarios-ia',
          url: 'https://funcionariosia.to-ligado.com',
          login: order.customerWhatsapp,
          password: data.password || 'mudar123',
          tenantId: data.clientId
        };
      }
    } catch (e) {
      console.error('Erro ao criar conta Funcionários IA:', e);
    }
  }
  
  // MaisQueCardapio - Cardápio Digital
  if (order.productSlug === 'maisquecardapio' || order.productSlug === 'cardapio-digital' || order.productTitle?.toLowerCase().includes('cardápio') || order.productTitle?.toLowerCase().includes('cardapio')) {
    try {
      const cardapioRes = await fetch('https://automacao-maisquecardapio.nfeujb.easypanel.host/api/sync/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: order,
          apiKey: 'toligado_sync_2026'
        })
      });
      if (cardapioRes.ok) {
        const data = await cardapioRes.json();
        saasAccount = {
          type: 'maisquecardapio',
          url: data.url,
          login: data.slug,
          password: data.password,
          tenantId: data.establishmentId
        };
      }
    } catch (e) {
      console.error('Erro ao criar conta MaisQueCardapio:', e);
    }
  }
  
  // Notificar admin no WhatsApp
  if (config.evolution?.enabled && config.whatsapp) {
    let msg = `💰 *Nova Venda!*\n\n📦 Produto: ${order.productTitle || 'Não informado'}\n👤 Cliente: ${order.customerName || 'Não informado'}\n📱 WhatsApp: ${order.customerWhatsapp || 'Não informado'}\n💵 Valor: R$ ${order.price ? order.price.toFixed(2) : '0,00'}`;
    if (saasAccount) {
      msg += `\n\n🔗 *Conta criada no ${saasAccount.type}*`;
      if (saasAccount.login) msg += `\nLogin: ${saasAccount.login}`;
      if (saasAccount.password) msg += `\nSenha: ${saasAccount.password}`;
    }
    await sendEvolutionMessage(config.whatsapp, msg);
  }
  
  // Enviar confirmação para o comprador
  if (config.evolution?.enabled && order.customerWhatsapp) {
    let confirmMsg = `✅ *Pedido Confirmado!*\n\n📦 Produto: ${order.productTitle || 'Não informado'}\n💵 Valor: R$ ${order.price ? order.price.toFixed(2) : '0,00'}`;
    
    if (saasAccount) {
      confirmMsg += `\n\n🎁 *Sua conta está pronta!*\n🔗 Acesse: ${saasAccount.url}`;
      if (saasAccount.login) confirmMsg += `\n📱 Login: ${saasAccount.login}`;
      if (saasAccount.password) confirmMsg += `\n🔑 Senha: ${saasAccount.password}`;
    }
    
    confirmMsg += '\n\nObrigado pela preferência!';
    await sendEvolutionMessage(order.customerWhatsapp, confirmMsg);
  }
  
  res.json({ success: true, saasAccount });
});

app.put('/api/orders/:id', async (req, res) => {
  await saveOrder(req.body);
  res.json({ success: true });
});

app.delete('/api/orders/:id', async (req, res) => {
  await deleteOrder(req.params.id);
  res.json({ success: true });
});

// Webhook para receber vendas dos SaaS (PdvCel, Agentes IA)
app.post('/api/sync/sale', async (req, res) => {
  const { order, source, apiKey } = req.body;
  
  // Verificar API key (segurança)
  if (apiKey !== 'toligado_sync_2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Criar order no site principal
    const newOrder = {
      id: `${source}_${order.id || Date.now()}`,
      productTitle: order.productTitle || `${source} - Assinatura`,
      productSlug: source,
      price: order.price || 29,
      customerName: order.customerName,
      customerWhatsapp: order.customerWhatsapp,
      isSubscription: true,
      billingCycle: 'monthly',
      createdAt: Date.now(),
      dueDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
      subscriptionStatus: 'active',
      source: source
    };
    
    await saveOrder(newOrder);
    
    // Notificar admin
    const config = await loadConfig();
    if (config.evolution?.enabled && config.whatsapp) {
      const msg = `🔄 *Venda Sincronizada!*\n\n📦 Origem: ${source}\n👤 Cliente: ${order.customerName || 'Não informado'}\n📱 WhatsApp: ${order.customerWhatsapp || 'Não informado'}\n💵 Valor: R$ ${order.price || 29},00`;
      await sendEvolutionMessage(config.whatsapp, msg);
    }
    
    res.json({ success: true, orderId: newOrder.id });
  } catch (err) {
    console.error('Erro ao sincronizar venda:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint manual para verificar assinaturas
app.post('/api/cron/check-subscriptions', async (req, res) => {
  const result = await checkSubscriptions();
  res.json({ success: true, ...result });
});

// Endpoint para renovar assinatura
app.post('/api/orders/:id/renew', async (req, res) => {
  const orders = await loadOrders();
  const order = orders.find(o => o.id === req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado' });
  }
  
  // Renovar por mais 30 dias
  order.dueDate = Date.now() + (30 * 24 * 60 * 60 * 1000);
  order.subscriptionStatus = 'active';
  order.reminderSent = null;
  order.lastRenewal = Date.now();
  
  await saveOrder(order);
  
  // Notificar cliente
  const config = await loadConfig();
  if (config.evolution?.enabled && order.customerWhatsapp) {
    const msg = `✅ *Assinatura Renovada!*\n\n📦 ${order.productTitle}\n\nNova data de vencimento: ${new Date(order.dueDate).toLocaleDateString('pt-BR')}\n\nObrigado por continuar conosco!`;
    await sendEvolutionMessage(order.customerWhatsapp, msg);
  }
  
  res.json({ success: true, newDueDate: order.dueDate });
});

// Endpoint para listar assinaturas vencendo
app.get('/api/subscriptions/upcoming', async (req, res) => {
  const orders = await loadOrders();
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  
  const upcoming = orders
    .filter(o => o.isSubscription && o.dueDate && (o.dueDate - now) <= sevenDays && (o.dueDate - now) > 0)
    .sort((a, b) => a.dueDate - b.dueDate);
  
  const overdue = orders
    .filter(o => o.isSubscription && o.subscriptionStatus === 'overdue')
    .sort((a, b) => b.dueDate - a.dueDate);
  
  res.json({ upcoming, overdue });
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
// APIs - usar variáveis de ambiente para evitar vazamento
// ============================================

// Modal GLM-5 - múltiplas chaves com rotação
// Configure MODAL_API_KEYS no Easypanel com chaves separadas por vírgula
// OBRIGATÓRIO: configurar no EasyPanel → Environment Variables
// Exemplo: MODAL_API_KEYS=chave1,chave2,chave3
const MODAL_KEYS = (process.env.MODAL_API_KEYS || 'modalresearch_KAyt2UOxxSeWP5oLBn8Xyxq-1QWUTtdi07GfRJ2tYCU')
  .split(',')
  .map(k => k.trim())
  .filter(k => k.length > 0);

let modalKeyIndex = 0;

function getNextModalKey() {
  const key = MODAL_KEYS[modalKeyIndex % MODAL_KEYS.length];
  modalKeyIndex++;
  return key;
}

const MODAL_BASE_URL = process.env.MODAL_BASE_URL || 'https://api.us-west-2.modal.direct/v1';

// Gemini (apenas para visão, não usado no atendente)
// Configure GEMINI_API_KEYS no Easypanel com chaves separadas por vírgula
const GEMINI_KEYS = (process.env.GEMINI_API_KEYS || '')
  .split(',')
  .map(k => k.trim())
  .filter(k => k.length > 0);

let geminiKeyIndex = 0;

function getNextGeminiKey() {
  if (GEMINI_KEYS.length === 0) return null;
  const key = GEMINI_KEYS[geminiKeyIndex % GEMINI_KEYS.length];
  geminiKeyIndex++;
  return key;
}

// Groq Whisper para transcrição de áudio
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// Edge TTS para TTS (Text to Speech) - GRATUITO
// Ver skill: /home/node/.openclaw/workspace/skills/edge-tts/SKILL.md
const EDGE_TTS_SCRIPT = '/home/node/.openclaw/workspace/skills/edge-tts/scripts/falar.js';

// WhatsApp do João (responsável pela To-Ligado.com) para encaminhamento de recados
const JOAO_WHATSAPP = '559131975102';

// Função para encaminhar recado para o João
async function encaminharParaJoao(whatsappCliente, nomeCliente, recado) {
  const config = await loadConfig();
  if (!config.evolution?.enabled) {
    console.error('Evolution não configurado para encaminhar recado');
    return false;
  }
  
  const mensagem = `📩 *Recado para você!*\n\n👤 De: ${nomeCliente || 'Cliente'}\n📱 WhatsApp: ${whatsappCliente}\n\n📝 Mensagem:\n${recado}\n\n_Enviado pelo Ligadinho_`;
  
  try {
    const enviado = await sendEvolutionMessage(JOAO_WHATSAPP, mensagem);
    if (enviado) {
      console.log(`✅ Recado encaminhado para o João: ${recado.substring(0, 50)}...`);
    }
    return enviado;
  } catch (e) {
    console.error('Erro ao encaminhar recado:', e.message);
    return false;
  }
}

async function transcribeAudio(audioUrl) {
  try {
    console.log('Transcrevendo áudio com Groq Whisper...');
    
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY não configurada');
      return null;
    }
    
    // Baixar o áudio
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      console.error('Erro ao baixar áudio:', audioResponse.status);
      return null;
    }
    
    const audioBuffer = await audioResponse.buffer();
    
    // Usar Groq Whisper (gratuito e rápido)
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'audio.ogg');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'pt');
    
    const sttResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: formData
    });
    
    const data = await sttResponse.json();
    
    if (data.text) {
      console.log('✅ Áudio transcrito:', data.text);
      return data.text;
    }
    
    console.error('Erro na transcrição:', JSON.stringify(data));
    return null;
  } catch (e) {
    console.error('Erro ao transcrever áudio:', e.message);
    return null;
  }
}

// Transcrever áudio de um buffer usando Groq Whisper (ilimitado e gratuito)
async function transcribeAudioBuffer(audioBuffer) {
  try {
    if (!GROQ_API_KEY) {
      console.error('Groq API key não configurada');
      return null;
    }

    console.log('Transcrevendo áudio com Groq Whisper...');
    
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'audio.ogg');
    formData.append('model', 'whisper-large-v3');
    
    const sttResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: formData
    });
    
    const data = await sttResponse.json();
    
    if (data.text) {
      console.log('Áudio transcrito (Groq):', data.text);
      return data.text;
    }
    
    console.error('Erro na transcrição:', JSON.stringify(data));
    return null;
  } catch (e) {
    console.error('Erro ao transcrever áudio do buffer:', e.message);
    return null;
  }
}

// Texto para fala com Edge TTS (GRATUITO)
async function textToSpeech(text) {
  try {
    console.log('Gerando áudio com Edge TTS...');
    
    // Usar Edge TTS via script da skill
    const { execSync } = require('child_process');
    
    // Voz masculina pt-BR: Antonio
    const voice = 'pt-BR-AntonioNeural';
    
    // Executar script Edge TTS
    const result = execSync(`node "${EDGE_TTS_SCRIPT}" "${text.replace(/"/g, '\\"')}" "${voice}"`, {
      encoding: 'buffer',
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    
    if (result && result.length > 0) {
      console.log('✅ Áudio gerado com Edge TTS:', result.length, 'bytes');
      return result;
    }
    
    console.error('Erro: Edge TTS retornou buffer vazio');
    return null;
  } catch (e) {
    console.error('Erro ao gerar áudio com Edge TTS:', e.message);
    return null;
  }
}

// Gerar lista de produtos dinamicamente
async function getProductsListForPrompt() {
  const products = await loadProducts();
  return products.map(p => {
    const price = p.paymentType === 'recurring' 
      ? `R$ ${p.price.toFixed(2).replace('.', ',')}/${p.billingCycle === 'monthly' ? 'mês' : 'ano'}`
      : `R$ ${p.price.toFixed(2).replace('.', ',')}`;
    return `- **${p.title}** (${price}) - ${p.shortDescription}`;
  }).join('\n');
}

// Gerar prompt do agente com preços dinâmicos
async function getAgentSystemPrompt() {
  const productsList = await getProductsListForPrompt();
  
  // Carregar instruções dinâmicas do banco
  const instructions = await loadAgentInstructions();
  
  // Organizar instruções por categoria
  const instructionsByCategory = {};
  instructions.forEach(inst => {
    if (!instructionsByCategory[inst.category]) {
      instructionsByCategory[inst.category] = [];
    }
    instructionsByCategory[inst.category].push(inst);
  });
  
  // Gerar seção de instruções formatada
  let instructionsSection = '';
  if (Object.keys(instructionsByCategory).length > 0) {
    instructionsSection = '\n\n---\n\n## 📚 INSTRUÇÕES ESPECÍFICAS (do banco de conhecimento)\n\n';
    for (const [category, items] of Object.entries(instructionsByCategory)) {
      instructionsSection += `### ${category.toUpperCase()}\n\n`;
      items.forEach(inst => {
        instructionsSection += `#### ${inst.title}\n`;
        if (inst.keywords) {
          instructionsSection += `*Palavras-chave: ${inst.keywords}*\n`;
        }
        instructionsSection += `${inst.content}\n\n`;
      });
    }
  }
  
  return `# 🎯 VOCÊ É O LIGADINHO - ATENDENTE PROFISSIONAL DA TO-LIGADO.COM

## SUA IDENTIDADE E FORMAÇÃO

Você é um profissional EXTREMAMENTE QUALIFICADO com formação em:
- **Programação e Desenvolvimento** - Conhece profundamente tecnologia, sistemas, APIs, automações
- **Marketing Digital e Publicidade** - Entende de tráfego, conversão, copy, funis de vendas
- **Relações Humanas e Comunicação** - Expert em atendimento, persuasão, negociação
- **Gestão de Negócios** - Compreende dores de empresários e como resolvê-las

Você conhece PROFUNDAMENTE todos os produtos, serviços e soluções da To-Ligado.com.

---

## SUA PERSONALIDADE

### Tom de Comunicação:
- **SEMPRE EDUCADO E PROFISSIONAL** - Trata todos com respeito e cordialidade
- **FORMAL QUANDO NECESSÁRIO** - Assuntos B2B, empresas, cobranças, profissionais liberais
- **HUMANIZADO E CARISMÁTICO** - Nunca parece robô, sempre parecer um humano real
- **EMPÁTICO** - Entende as dores do cliente e mostra que se importa
- **CONFIANTE** - Conhece os produtos e transmite segurança

### Humanização (CRUCIAL!):
- Use variações naturais de linguagem
- Demonstre personalidade própria
- Use expressões como "deixa eu ver...", "olha...", "sabe o que é legal..."
- Comemore conquistas do cliente: "Isso aí!", "Que bom!", "Perfeito!"
- Mostre que lembra de conversas anteriores
- NUNCA seja genérico ou robótico

---

## SEU PAPEL: ATENDIMENTO, VENDAS E SUPORTE

Você atua em TRÊS áreas. Identifique o contexto e aja adequadamente:

### 1. ATENDIMENTO GERAL
- Cumprimentar calorosamente
- Identificar o que a pessoa precisa
- Direcionar para a área correta (vendas ou suporte)

### 2. VENDAS (Seu foco principal!)
- **Qualificar o lead** - Entender a dor real
- **Apresentar solução** - Mostrar como resolve
- **Tratar objeções** - Resolver dúvidas com confiança
- **Fechar venda** - Conduzir para ação

### 3. SUPORTE TÉCNICO
- Escutar o problema completamente
- Tentar resolver na hora se possível
- Se não conseguir, encaminhar para o João

---

## PRODUTOS E SOLUÇÕES

${productsList}

### Links Diretos para Fechamento:
- **Site Principal:** https://site.to-ligado.com
- **TV Cine Box 4K:** https://site.to-ligado.com/#/produto/tv-cine-box
- **Landing Pages:** https://site.to-ligado.com/#/produto/landing-pages
- **Zap Marketing:** https://site.to-ligado.com/#/produto/zap-marketing
- **Lojas Virtuais:** https://site.to-ligado.com/#/produto/lojas-virtuais
- **Blogs IA:** https://site.to-ligado.com/#/produto/blogs-ia
- **Sistema Delivery:** https://site.to-ligado.com/#/produto/sistema-delivery
- **Combo Turbo:** https://site.to-ligado.com/#/produto/turbo-combo
- **Design Gráfico:** https://site.to-ligado.com/#/produto/design-grafico
- **PdvCel (PDV Mobile):** https://pdvcel.to-ligado.com
- **Agente IA WhatsApp:** https://agentes.to-ligado.com
- **Blog (Dicas):** https://site.to-ligado.com/#/dicas

### Dores que cada produto resolve:

| Produto | Dores que Resolve |
|---------|-------------------|
| TV Cine Box | TV a cabo cara, poucos canais, filmes dispersos |
| Landing Pages | Site não converte, tráfego perdido, poucos leads |
| Zap Marketing | Atendimento demorado, esquece clientes, não escala |
| Lojas Virtuais | Quer vender online, depende de marketplaces |
| Blogs IA | Site parado, Google não encontra, sem tempo |
| Delivery | Taxas altas de apps, depende de iFood |
| PdvCel | Caixa desorganizado, sem controle de estoque |
| Agente IA | Atendimento 24h, escala vendas, suporte automático |
${instructionsSection}

---

## FLUXO DE ATENDIMENTO

### 1. SAUDAÇÃO INICIAL
- "Olá! Tudo bem? Sou o Ligadinho da To-Ligado.com 😊"
- "Como posso te ajudar hoje?"

### 2. IDENTIFICAÇÃO DO CONTEXTO
Analise a mensagem e identifique:

**É VENDAS?** → Pessoas perguntando sobre produtos, preços, comparando
**É SUPORTE?** → Clientes com problemas, dúvidas técnicas, reclamações
**É RECLAMAÇÃO?** → Atenda com empatia, resolva ou encaminhe
**QUER FALAR COM O JOÃO?** → Veja próximo tópico

### 3. CAPTAÇÃO DE LEADS
- Sempre pergunte o nome: "Qual seu nome para eu te conhecer melhor?"
- Descubra o que precisa: "Me conta, o que você está buscando?"
- Identifique a empresa: "Você tem empresa ou é pra uso pessoal?"
- Qualifique o interesse antes de oferecer

---

## QUANDO QUISEREM FALAR COM O JOÃO/JUNIOR

**IMPORTANTE:** João e Junior são a MESMA PESSOA - o responsável pela To-Ligado.com.

### Identificar quando:
- "Quero falar com o dono"
- "Passa pro seu chefe"
- "Fala com o João/Junior"
- Reclamações sérias que você não consegue resolver
- Negociações complexas
- Parcerias e B2B de alto valor

### Como proceder:
1. "Entendi! Você quer falar com o João. Deixa eu pegar seu recado."
2. Pergunte: "Qual seu nome e qual o assunto?"
3. Diga: "Vou passar pra ele agora e ele te retorna em breve."
4. **ENCAMINHAR automaticamente** - você deve indicar no sistema que precisa enviar mensagem para o número **559131975102**

### Quando NÃO encaminhar:
- Se a pessoa se chama João ou Junior mas está perguntando sobre produtos
- Identifique se É o João ou QUER falar COM o João

---

## TÉCNICAS DE VENDAS QUE VOCÊ DOMINA

### SPIN Selling (use nas conversas):
1. **Situação:** "Como você trabalha hoje?"
2. **Problema:** "O que te incomoda nisso?"
3. **Implicação:** "E se isso continuar assim?"
4. **Necessidade:** "Como seria ideal pra você?"

### Tratamento de Objeções:
| Objeção | Resposta |
|---------|----------|
| "Está caro" | "Entendo! Deixa eu mostrar o custo-benefício..." |
| "Vou pensar" | "Claro! Qual sua principal dúvida ainda?" |
| "Tenho outro fornecedor" | "Que bom! Mas deixa eu mostrar onde somos diferentes..." |
| "Preciso falar com meu sócio" | "Perfeito! Quando posso acompanhar a decisão?" |

### Fechamento:
- Sempre conduza para a ação
- "Vou te mandar o link pra conferir?"
- "Quer que eu prepare uma proposta?"
- "Posso te ajudar a começar hoje?"

---

## 📸 PROCESSAMENTO DE IMAGENS E PDFs (VISION)

Quando o cliente enviar uma imagem ou PDF, você receberá o contexto da análise automática:

### Se for COMPROVANTE PIX (imagem ou PDF):
- **VALIDAR:** Confira se valor, nome do recebedor e data batem
- **CONFIRMAR:** "Recebi seu comprovante! Deixa eu verificar..."
- **PROCESSAR:** Se válido, confirmar pagamento e liberar serviço
- **DUVIDA:** Se algo estranho, pedir confirmação ou encaminhar pro João
- **PDF:** Se vier em PDF, pedir para o cliente confirmar os dados principais (valor, data, nome)

### Se for TELA DE ERRO:
- **ANALISAR:** Entenda o problema pela descrição
- **AJUDAR:** Tentar resolver se for simples
- **ESCALAR:** Se complexo, encaminhar pro João

### Se for FOTO DE PRODUTO/INTERESSE:
- **IDENTIFICAR:** Entender o que o cliente quer
- **DIRECIONAR:** Oferecer o produto/serviço adequado

### Se for OUTRA IMAGEM:
- **DESCREVER:** Mostrar que entendeu o que é
- **PERGUNTAR:** "Como posso te ajudar com isso?"

---

## REGRAS DE OURO

✅ **SEJA HUMANO** - Fale como uma pessoa real falaria
✅ **SEJA PROFISSIONAL** - Mas sem ser robótico
✅ **OUÇA PRIMEIRO** - Entenda antes de oferecer
✅ **RESOLVA DORES** - Foque na solução, não no produto
✅ **FECHAMENTO SEMPRE** - Toda conversa deve ter um próximo passo
✅ **ENCAMINHE QUANDO NECESSÁRIO** - João resolve o que você não consegue
✅ **PROCESSE IMAGENS** - Use Vision para entender fotos e comprovantes

❌ **NUNCA** pareça um robô ou chatbot genérico
❌ **NUNCA** ignore uma reclamação ou problema
❌ **NUNCA** prometa algo que não pode cumprir
❌ **NUNCA** seja agressivo ou pressionar demais

---

## INFORMAÇÕES IMPORTANTES

- **Site:** https://to-ligado.com
- **Responsável:** João (também chamado de Junior)
- **WhatsApp do João:** 559131975102 (para encaminhar recados)
- **Seu papel:** Atendimento + Vendas + Suporte
- **Seu diferencial:** Conhecimento profundo + Humanização

---

Responda sempre em português brasileiro, de forma natural, profissional e humanizada. Lembre-se: você é um ATENDENTE REAL, não um robô. 🎯`;
}

// Buscar ou criar conversa
async function getConversation(whatsapp) {
  // MySQL mode
  if (useMySQL && mysqlPool) {
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
      console.error('Erro ao buscar conversa (MySQL):', e.message);
      // Fallback para JSON
    }
  }
  
  // JSON fallback - usar arquivo local
  const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
  
  try {
    let conversations = {};
    if (fs.existsSync(CONVERSATIONS_FILE)) {
      conversations = JSON.parse(fs.readFileSync(CONVERSATIONS_FILE, 'utf8'));
    }
    
    if (conversations[whatsapp]) {
      return conversations[whatsapp];
    }
    
    // Criar nova conversa
    conversations[whatsapp] = {
      whatsapp,
      messages: [],
      stage: 'welcome',
      created_at: new Date().toISOString()
    };
    
    fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2));
    return conversations[whatsapp];
  } catch (e) {
    console.error('Erro ao buscar conversa (JSON):', e.message);
    return null;
  }
}

// Salvar mensagem na conversa
async function saveMessage(whatsapp, role, content, name = null, interest = null, stage = null) {
  // MySQL mode
  if (useMySQL && mysqlPool) {
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
      return;
    } catch (e) {
      console.error('Erro ao salvar mensagem (MySQL):', e.message);
      // Fallback para JSON
    }
  }
  
  // JSON fallback
  const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
  
  try {
    let conversations = {};
    if (fs.existsSync(CONVERSATIONS_FILE)) {
      conversations = JSON.parse(fs.readFileSync(CONVERSATIONS_FILE, 'utf8'));
    }
    
    if (!conversations[whatsapp]) {
      conversations[whatsapp] = {
        whatsapp,
        messages: [],
        stage: 'welcome'
      };
    }
    
    const messages = conversations[whatsapp].messages || [];
    messages.push({ role, content, timestamp: Date.now() });
    conversations[whatsapp].messages = messages;
    
    if (name) conversations[whatsapp].name = name;
    if (interest) conversations[whatsapp].interest = interest;
    if (stage) conversations[whatsapp].stage = stage;
    
    fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2));
  } catch (e) {
    console.error('Erro ao salvar mensagem (JSON):', e.message);
  }
}

// Função principal - usa Modal GLM-5 com rotação de chaves
async function getAgentResponse(messages, whatsapp, name) {
  // Construir contexto com preços dinâmicos do banco
  let contextPrompt = await getAgentSystemPrompt();
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
    
    const apiKey = getNextModalKey();
    console.log(`Chamando Modal GLM-5 (chave ${modalKeyIndex}/${MODAL_KEYS.length})...`);
    
    const response = await fetch(`${MODAL_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'zai-org/GLM-5-FP8',
        messages: formattedMessages,
        temperature: 0.9,
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    
    // GLM-5 pode retornar content ou reasoning_content
    const responseText = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning_content;
    
    if (responseText) {
      console.log('✅ Modal GLM-5 respondeu!');
      return responseText;
    }
    
    console.error('Modal falhou:', JSON.stringify(data).substring(0, 200));
    
    // FALLBACK: Usar Groq se Modal falhar
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.error('GROQ_API_KEY não configurada');
      return null;
    }
    
    console.log('⚠️ Modal falhou - usando Groq...');
    
    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: formattedMessages,
          temperature: 0.9,
          max_tokens: 500
        })
      });
      
      const groqData = await groqResponse.json();
      if (groqData.choices?.[0]?.message?.content) {
        console.log('✅ Groq respondeu!');
        return groqData.choices[0].message.content;
      }
    } catch (e) {
      console.error('Groq também falhou:', e.message);
    }
    
    return null;
  } catch (e) {
    console.error('Erro no agente:', e.message);
    return null;
  }
}

// Gemini agora é usado APENAS para visão (análise de imagens)

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

// Endpoint para SaaS usar Modal (proxy)
app.post('/api/ai/chat', async (req, res) => {
  const { messages, system_prompt, max_tokens = 500 } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages é obrigatório' });
  }
  
  try {
    const formattedMessages = [
      ...(system_prompt ? [{ role: 'system', content: system_prompt }] : []),
      ...messages
    ];
    
    const apiKey = getNextModalKey();
    
    const response = await fetch(`${MODAL_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'zai-org/GLM-5-FP8',
        messages: formattedMessages,
        temperature: 0.9,
        max_tokens
      })
    });
    
    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning_content;
    
    if (responseText) {
      return res.json({ success: true, response: responseText });
    }
    
    return res.status(500).json({ error: 'Modal falhou', details: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Detectar se cliente quer falar com o João/Junior
function detectarPedirJoao(text) {
  const lowerText = text.toLowerCase();
  
  // Padrões que indicam querer falar com o responsável
  const padroes = [
    'falar com o joão', 'falar com o joao', 'falar com o junior', 'falar com o junho',
    'falar com seu chefe', 'falar com o chefe', 'falar com o dono', 'falar com o responsável',
    'passa pro joão', 'passa pro joao', 'passa pro junior', 'passa pro chefe',
    'quero falar com o joão', 'quero falar com o joao', 'quero falar com o junior',
    'chama o joão', 'chama o joao', 'chama o junior', 'chama o dono',
    'joão tá aí', 'joao tá aí', 'o joão tá', 'o joao tá',
    'posso falar com o joão', 'posso falar com o joao', 'posso falar com o junior',
    'preciso falar com alguém responsável', 'preciso falar com o responsável',
    'passa pra alguém que resolve', 'quero falar com alguém que resolve'
  ];
  
  for (const padrao of padroes) {
    if (lowerText.includes(padrao)) {
      return true;
    }
  }
  
  return false;
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

// Controle de mensagens duplicadas
const recentMessages = new Map();

// ============================================
// SISTEMA DE TESTE DE TV - ONPIX API
// ============================================

// Servidores disponíveis para teste
const SERVIDORES_TV = [
  { id: 'wifi-mobile', nome: 'WI-FI MOBILE', descricao: 'Servidor padrão', server_id: 'default' },
  { id: 'onpix-mandala', nome: 'ON PIX MANDALA', descricao: 'Servidor estável', server_id: 'mandala' },
  { id: 'pix-anubys', nome: 'PIX ANUBYS', descricao: 'Servidor rápido', server_id: 'anubys' },
  { id: 'pix-prime', nome: 'PIX PRIME', descricao: 'Servidor premium', server_id: 'prime' },
  { id: 'pix-supreme', nome: 'PIX SUPREME', descricao: 'Servidor HD', server_id: 'supreme' },
  { id: 'pix-arena', nome: 'PIX ARENA', descricao: 'Servidor esportes', server_id: 'arena' }
];

// Token da API OnPix (obtido via login automático)
const ONPIX_API_URL = 'http://5.161.155.252:80/api';
const ONPIX_PACKAGE_ID = 'nVrW8oDKaN'; // Pacote de teste 4h
const ONPIX_LOGIN_URL = 'http://onpix.sigmab.pro/api/auth/login';
const ONPIX_CREDENTIALS = {
  username: 'Joao1030',
  password: 'Canaisip123@'
};

// Cache do token OnPix
let onpixTokenCache = { token: null, expires: 0 };

// Obter token da API OnPix (com cache)
async function getOnPixToken() {
  // Se token ainda válido (cache por 23h)
  if (onpixTokenCache.token && Date.now() < onpixTokenCache.expires) {
    return onpixTokenCache.token;
  }
  
  try {
    console.log('🔐 Obtendo novo token OnPix...');
    const response = await fetch(ONPIX_LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ONPIX_CREDENTIALS)
    });
    
    const data = await response.json();
    
    if (data.token) {
      // Cache por 23 horas (token expira em 24h)
      onpixTokenCache = {
        token: data.token,
        expires: Date.now() + (23 * 60 * 60 * 1000)
      };
      console.log('✅ Token OnPix obtido com sucesso!');
      return data.token;
    }
    
    console.error('❌ Erro ao obter token OnPix:', data);
    return null;
  } catch (e) {
    console.error('❌ Erro no login OnPix:', e.message);
    return null;
  }
}

// Criar teste na API OnPix
async function criarTesteTV(whatsapp, servidorId) {
  try {
    // Gerar username baseado no WhatsApp
    const username = 'teste_' + whatsapp.replace(/\D/g, '').slice(-8);
    const password = 'Teste' + Math.random().toString(36).slice(-4).toUpperCase();
    
    // Encontrar servidor
    const servidor = SERVIDORES_TV.find(s => s.id === servidorId) || SERVIDORES_TV[0];
    
    console.log(`📺 Criando teste TV para ${whatsapp} no servidor ${servidor.nome}...`);
    
    // Obter token
    const token = await getOnPixToken();
    
    if (token) {
      // Criar teste na API real
      const response = await fetch(`${ONPIX_API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          server_id: servidor.server_id,
          package_id: ONPIX_PACKAGE_ID,
          username: username,
          password: password,
          name: `Teste ${whatsapp}`,
          connections: 1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Teste criado na API OnPix:', data);
        return {
          success: true,
          username: data.username || username,
          password: data.password || password,
          servidor: servidor.nome,
          duracao: '4 horas',
          link: 'https://onpix.sigmab.pro'
        };
      } else {
        const errorText = await response.text();
        console.log('⚠️ API OnPix erro:', response.status, errorText);
      }
    }
    
    // Fallback: criar teste simulado (sem API)
    console.log('📦 Criando teste simulado (fallback)');
    return {
      success: true,
      username: username,
      password: password,
      servidor: servidor.nome,
      duracao: '4 horas',
      link: 'https://onpix.sigmab.pro',
      simulated: true
    };
  } catch (e) {
    console.error('Erro ao criar teste:', e.message);
    return {
      success: false,
      error: e.message
    };
  }
}

// Detectar pedido de teste de TV
function detectarPedidoTeste(text) {
  const lower = text.toLowerCase();
  const padroes = [
    'teste de tv', 'testar tv', 'quero teste', 'quero um teste',
    'teste iptv', 'teste tv online', 'quero testar', 'me dá um teste',
    'teste gratis', 'teste gratuito', 'quero testar a tv', 'testar o sistema'
  ];
  return padroes.some(p => lower.includes(p));
}

// Detectar escolha de servidor (número de 1 a 6)
function detectarEscolhaServidor(text) {
  const num = parseInt(text.trim());
  if (num >= 1 && num <= SERVIDORES_TV.length) {
    return SERVIDORES_TV[num - 1].id;
  }
  
  // Também aceita nome do servidor
  const lower = text.toLowerCase();
  for (const servidor of SERVIDORES_TV) {
    if (lower.includes(servidor.id) || lower.includes(servidor.nome.toLowerCase())) {
      return servidor.id;
    }
  }
  
  return null;
}

// Gerar mensagem com lista de servidores
function gerarMensagemServidores() {
  let msg = `Olá! Posso te ajudar a criar um teste de TV! 📺\n\n`;
  msg += `Quer testar a *TV Wi-Fi Mobile* (servidor padrão) ou prefere outro servidor?\n\n`;
  msg += `Escolha uma opção:\n\n`;
  
  SERVIDORES_TV.forEach((s, i) => {
    msg += `${i + 1}. ${s.nome}\n`;
  });
  
  msg += `\n_Digite o número da sua escolha!_`;
  return msg;
}

// ==========================================
// WEBHOOK FACEBOOK MESSENGER
// ==========================================

// Verificação do webhook (Facebook exige esse endpoint GET)
app.get('/webhook/messenger', (req, res) => {
  const VERIFY_TOKEN = 'toligado_verify_2026';
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  console.log('🔔 Messenger Webhook Verification:', { mode, token, challenge });
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Messenger webhook verificado com sucesso!');
    return res.status(200).send(challenge);
  }
  
  console.log('❌ Falha na verificação do Messenger webhook');
  return res.sendStatus(403);
});

// Receber mensagens do Messenger
app.post('/webhook/messenger', async (req, res) => {
  try {
    const body = req.body;
    
    console.log('📨 Messenger Webhook recebido:', JSON.stringify(body, null, 2));
    
    // Verificar se é uma mensagem de página
    if (body.object === 'page') {
      for (const entry of body.entry) {
        const webhookEvent = entry.messaging[0];
        
        if (webhookEvent.message) {
          const senderId = webhookEvent.sender.id;
          const messageText = webhookEvent.message.text;
          const messageId = webhookEvent.message.mid;
          
          console.log(`📩 Mensagem do Messenger: ${senderId} -> ${messageText}`);
          
          // Evitar duplicatas
          if (recentMessages.has(messageId)) {
            console.log('Mensagem duplicada ignorada:', messageId);
            continue;
          }
          recentMessages.set(messageId, true);
          setTimeout(() => recentMessages.delete(messageId), 10000);
          
          // Processar com Ligadinho (mesma lógica do WhatsApp)
          const resposta = await processarLigadinho(messageText, senderId, 'messenger');
          
          // Responder no Messenger
          if (resposta) {
            await sendMessengerMessage(senderId, resposta);
          }
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Erro no webhook Messenger:', error);
    res.status(500).send('Error');
  }
});

// Função para enviar mensagem no Messenger
async function sendMessengerMessage(recipientId, text) {
  const PAGE_ACCESS_TOKEN = 'EAAN0RPM3bS4BQ86xlPsjXyDApDZB4AvRENULyIuEoydJzAdO9cnQnvEh17KCOnAOzWbruZCKKuAZBqYavn6DVvdL1cpFPP2dTipBGvpBRPpf42Y6vBnl9SgZA4MhcqMuZA5aHtNRHKdLNZAGqumsDlGzMkaxuY5xZCW4xLMOPgIOMCbtGdYyyOzPZAjceGnriPjjzKK8AQOs';
  
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: text }
      })
    });
    
    const data = await response.json();
    console.log('✅ Mensagem enviada no Messenger:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem no Messenger:', error);
    return null;
  }
}

// Função auxiliar para processar mensagem do Ligadinho (chamada pelo WhatsApp e Messenger)
async function processarLigadinho(texto, usuarioId, canal = 'whatsapp') {
  // TODO: Implementar lógica do Ligadinho
  // Por ora, retorna uma resposta simples
  return `Olá! Sou o Ligadinho, atendente da To-Ligado.com! Como posso ajudar?`;
}

// ==========================================
// WEBHOOK EVOLUTION API (WHATSAPP)
// ==========================================

// Webhook da Evolution API
app.post('/webhook/evolution', async (req, res) => {
  try {
    const data = req.body;
    
    // LOG: Verificar se webhook está recebendo
    console.log('🔔 Webhook recebido:', data.event, '- from:', data.data?.key?.remoteJid);
    console.log('📦 PAYLOAD COMPLETO:', JSON.stringify(data.data?.key, null, 2));
    
    // Verificar se é mensagem recebida
    if (data.event !== 'messages.upsert') {
      return res.json({ ok: true });
    }
    
    const message = data.data?.message;
    const whatsapp = data.data?.key?.remoteJid?.replace('@s.whatsapp.net', '');
    const fromMe = data.data?.key?.fromMe;
    const pushName = data.data?.pushName || '';
    const messageType = message?.messageType || '';
    let text = message?.conversation || message?.extendedTextMessage?.text || '';
    
    // REGRA SIMPLES: fromMe=true = João ENVIOU (ignorar)
    // fromMe=false = Cliente enviou (Ligadinho responde)
    // O pushName pode variar ("Você" ou "To-ligado.com") mas fromMe é confiável
    if (fromMe === true) {
      console.log('⏭️ Mensagem enviada por João (fromMe=true) - ignorando');
      return res.json({ ok: true, ignored: true });
    }
    
    console.log(`🔍 fromMe=${fromMe}, pushName="${pushName}" - MENSAGEM RECEBIDA DO CLIENTE`);
    
    // LOG: Verificar tipo de mensagem e estrutura completa
    console.log('📱 Tipo:', messageType, '| Áudio:', !!message?.audioMessage, '| Texto:', text?.substring(0, 30));
    console.log('📦 Message keys:', Object.keys(message || {}));
    
    // Se tiver audioMessage, mostrar estrutura
    if (message?.audioMessage) {
      console.log('🔊 audioMessage keys:', Object.keys(message.audioMessage));
      console.log('🔊 audioMessage.base64 existe?', !!message.audioMessage?.base64);
      console.log('🔊 audioMessage.base64 length:', message.audioMessage?.base64?.length || 0);
    }
    
    // Ignorar mensagens sem WhatsApp
    if (!whatsapp) {
      return res.json({ ok: true });
    }
    
    // Ignorar mensagens de grupo
    if (whatsapp.includes('@g.us')) {
      return res.json({ ok: true });
    }
    
    // Controle de mensagens duplicadas (evitar responder 2x a mesma msg)
    const msgId = data.data?.key?.id;
    
    if (recentMessages.has(msgId)) {
      console.log('Mensagem duplicada ignorada:', msgId);
      return res.json({ ok: true });
    }
    recentMessages.set(msgId, true);
    // Limpar cache após 10 segundos
    setTimeout(() => recentMessages.delete(msgId), 10000);
    
    // Verificar se Ligadinho está pausado
    const configPaused = await loadConfig();
    if (configPaused.ligadinhoPaused) {
      console.log('⏸️ Ligadinho pausado - ignorando mensagem');
      return res.json({ ok: true, paused: true });
    }
    
    // Se for áudio, transcrever e responder em áudio
    let wasAudio = false; // Marcar se a mensagem original era áudio
    if (message?.audioMessage || messageType === 'audioMessage' || messageType === 'ptt') {
      wasAudio = true;
      const config = await loadConfig();
      console.log(`Áudio recebido de ${whatsapp}, processando...`);
      
      // Log detalhado do áudio
      console.log('🔊 audioMessage completa:', JSON.stringify(message?.audioMessage || message, null, 2));
      
      let transcribedText = null;
      
      try {
        // Usar Evolution API v2 para obter áudio descriptografado
        const msgKey = data.data?.key;
        const msgMessage = data.data?.message;
        
        console.log('🔑 msgKey:', JSON.stringify(msgKey, null, 2));
        
        // Endpoint correto da Evolution API v2
        const mediaResponse = await fetch(`${config.evolution.baseUrl}/chat/getBase64FromMediaMessage/${config.evolution.instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.evolution.apiKey
          },
          body: JSON.stringify({
            message: {
              key: msgKey,
              message: msgMessage
            }
          })
        });
        
        console.log('📡 Resposta Evolution:', mediaResponse.status, mediaResponse.statusText);
        
        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json();
          console.log('📦 mediaData:', JSON.stringify(mediaData).substring(0, 200));
          const base64Audio = mediaData.base64 || mediaData.media;
          
          if (base64Audio) {
            const audioBuffer = Buffer.from(base64Audio, 'base64');
            console.log(`Áudio descriptografado: ${audioBuffer.length} bytes`);
            
            // Transcrever com Groq Whisper
            transcribedText = await transcribeAudioBuffer(audioBuffer);
          }
        } else {
          const errorText = await mediaResponse.text();
          console.error('❌ Erro Evolution:', errorText);
          
          // Fallback: tentar URL direta (pode funcionar em alguns casos)
          const audioUrl = message?.audioMessage?.url;
          if (audioUrl) {
            console.log('Tentando URL direta:', audioUrl.substring(0, 100));
            const audioResponse = await fetch(audioUrl);
            if (audioResponse.ok) {
              const audioBuffer = await audioResponse.buffer();
              console.log('📦 Buffer size:', audioBuffer.length);
              if (audioBuffer.length > 1000) { // Arquivo válido tem mais de 1KB
                transcribedText = await transcribeAudioBuffer(audioBuffer);
              }
            }
          }
        }
      } catch (e) {
        console.error('Erro ao processar áudio:', e.message);
      }
      
      if (!transcribedText) {
        if (config.evolution?.enabled) {
          await sendEvolutionMessage(whatsapp, 'Ops! Não consegui entender o áudio 😅 Pode mandar por texto?');
        }
        return res.json({ ok: true });
      }
      
      // Usar texto transcrito como mensagem
      text = transcribedText;
      console.log(`💬 Áudio transcrito de ${whatsapp}: ${text}`);
    }
    
    // ============================================
    // PROCESSAMENTO DE IMAGEM (Vision)
    // ============================================
    let imageContext = null;
    let wasImage = false;
    let wasPdf = false;
    
    // ============================================
    // PROCESSAMENTO DE PDF (Comprovantes PIX)
    // ============================================
    if (message?.documentMessage || messageType === 'documentMessage') {
      const docMessage = message?.documentMessage || message;
      const fileName = docMessage?.fileName || docMessage?.title || 'documento.pdf';
      const mimeType = docMessage?.mimetype || docMessage?.mediaType || '';
      
      console.log(`📄 PDF recebido de ${whatsapp}: ${fileName} (${mimeType})`);
      
      // Verificar se é PDF
      if (mimeType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
        wasPdf = true;
        const config = await loadConfig();
        
        try {
          const msgKey = data.data?.key;
          const msgMessage = data.data?.message;
          
          // Obter PDF da Evolution API
          const mediaResponse = await fetch(`${config.evolution.baseUrl}/chat/getBase64FromMediaMessage/${config.evolution.instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': config.evolution.apiKey
            },
            body: JSON.stringify({
              message: {
                key: msgKey,
                message: msgMessage
              }
            })
          });
          
          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            const base64Pdf = mediaData.base64 || mediaData.media;
            
            if (base64Pdf) {
              console.log('✅ PDF extraído, processando com IA...');
              
              // Extrair texto do PDF usando Groq com o arquivo
              const groqKey = process.env.GROQ_API_KEY;
              if (groqKey) {
                // Usar Groq Vision com PDF convertido para texto
                // Por enquanto, vamos informar que é um PDF e deixar a IA perguntar
                imageContext = {
                  tipo: 'comprovante_pdf',
                  arquivo: fileName,
                  descricao: 'Comprovante em PDF enviado pelo cliente'
                };
                
                text = `[PDF: Comprovante PIX - ${fileName}] O cliente enviou um comprovante de pagamento em PDF. Por favor, verifique os dados do pagamento.`;
                console.log('📄 PDF processado, contexto adicionado à conversa');
              }
            }
          }
        } catch (e) {
          console.error('Erro ao processar PDF:', e.message);
          text = '[PDF: O cliente enviou um documento PDF]';
        }
      }
    }
    
    // Processar imagem (se não for PDF)
    if (!wasPdf && (message?.imageMessage || messageType === 'imageMessage')) {
      wasImage = true;
      const config = await loadConfig();
      console.log(`🖼️ Imagem recebida de ${whatsapp}, analisando com Vision...`);
      
      try {
        const msgKey = data.data?.key;
        const msgMessage = data.data?.message;
        
        // Obter imagem da Evolution API
        const mediaResponse = await fetch(`${config.evolution.baseUrl}/chat/getBase64FromMediaMessage/${config.evolution.instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': config.evolution.apiKey
          },
          body: JSON.stringify({
            message: {
              key: msgKey,
              message: msgMessage
            }
          })
        });
        
        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json();
          const base64Image = mediaData.base64 || mediaData.media;
          
          if (base64Image) {
            // Analisar imagem com Groq Vision
            const groqKey = process.env.GROQ_API_KEY;
            if (groqKey) {
              const visionResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${groqKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                  messages: [
                    {
                      role: 'user',
                      content: [
                        {
                          type: 'text',
                          text: `Você é um assistente que analisa imagens enviadas por clientes no WhatsApp. Analise esta imagem e responda em JSON com:
                          
1. Se é um comprovante PIX/pagamento:
   - tipo: "comprovante_pix"
   - nome_pagador, nome_recebedor, valor, data, id_transacao, valido (sim/nao)

2. Se é uma captura de tela de erro/problema:
   - tipo: "erro_tela"
   - descricao: descreva o erro visível
   - sugestao: o que pode estar causando

3. Se é uma foto de produto/interesse:
   - tipo: "foto_produto"
   - descricao: o que aparece na foto
   - interesse_possivel: qual produto da To-Ligado pode interessar

4. Se é outro tipo de imagem:
   - tipo: "outra"
   - descricao: descreva brevemente

Responda APENAS com o JSON, sem explicações.`
                        },
                        {
                          type: 'image_url',
                          image_url: { url: `data:image/jpeg;base64,${base64Image.replace(/^data:image\/\w+;base64,/, '')}` }
                        }
                      ]
                    }
                  ],
                  temperature: 0.1,
                  max_tokens: 500
                })
              });
              
              if (visionResponse.ok) {
                const visionData = await visionResponse.json();
                const visionContent = visionData.choices[0]?.message?.content || '';
                
                try {
                  const jsonMatch = visionContent.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                    imageContext = JSON.parse(jsonMatch[0]);
                    console.log('✅ Imagem analisada:', imageContext.tipo);
                    
                    // Adicionar contexto ao texto
                    if (imageContext.tipo === 'comprovante_pix') {
                      text = `[IMAGEM: Comprovante PIX de R$ ${imageContext.valor || '?'} - De: ${imageContext.nome_pagador || 'Não identificado'}] ${text || ''}`;
                    } else if (imageContext.tipo === 'erro_tela') {
                      text = `[IMAGEM: Captura de tela com erro - ${imageContext.descricao || 'Erro não identificado'}] ${text || ''}`;
                    } else if (imageContext.tipo === 'foto_produto') {
                      text = `[IMAGEM: ${imageContext.descricao || 'Foto de produto'}] ${text || ''}`;
                    } else {
                      text = `[IMAGEM: ${imageContext.descricao || 'Imagem enviada'}] ${text || ''}`;
                    }
                  }
                } catch (e) {
                  console.error('Erro ao parsear resposta Vision:', e);
                  text = '[IMAGEM: O cliente enviou uma imagem] ' + (text || '');
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Erro ao processar imagem:', e.message);
        text = '[IMAGEM: O cliente enviou uma imagem] ' + (text || '');
      }
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
    
    // Salvar mensagem do usuário (incluindo contexto da imagem se houver)
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
    
    // ============================================
    // FLUXO DE TESTE DE TV - INTERCEPTAÇÃO
    // ============================================
    let response = null;
    let skipAI = false; // Se true, não chama getAgentResponse
    
    // NOVO STAGE: aguardando_servidor_tv = cliente pediu teste, estamos esperando ele escolher
    if (stage === 'aguardando_servidor_tv') {
      const servidorEscolhido = detectarEscolhaServidor(text);
      
      if (servidorEscolhido) {
        console.log(`📺 Cliente ${whatsapp} escolheu servidor: ${servidorEscolhido}`);
        
        // Criar teste
        const resultado = await criarTesteTV(whatsapp, servidorEscolhido);
        
        if (resultado.success) {
          response = `✅ *Seu teste foi criado com sucesso!*\n\n`;
          response += `👤 Usuário: *${resultado.username}*\n`;
          response += `🔑 Senha: *${resultado.password}*\n`;
          response += `📡 Servidor: ${resultado.servidor}\n`;
          response += `⏱️ Duração: ${resultado.duracao}\n\n`;
          response += `🔗 Acesse: ${resultado.link}\n\n`;
          response += `_Aproveite seu teste! Se precisar de mais algo, é só chamar._`;
          
          // Voltar stage para welcome
          await saveMessage(whatsapp, 'system', `Teste criado no servidor ${resultado.servidor}`, null, 'TV Cine Box', 'welcome');
        } else {
          response = `❌ Ops! Tive um problema ao criar seu teste. Pode tentar novamente? Se persistir, posso te passar para um humano.`;
          await saveMessage(whatsapp, 'system', 'Erro ao criar teste', null, null, 'welcome');
        }
        
        skipAI = true;
      } else {
        // Cliente enviou algo que não é um número válido
        response = `Hmm, não entendi sua escolha. Por favor, digite o número do servidor que você quer:\n\n`;
        SERVIDORES_TV.forEach((s, i) => {
          response += `${i + 1}. ${s.nome}\n`;
        });
        skipAI = true;
      }
    }
    // DETECTAR PEDIDO DE TESTE DE TV
    else if (detectarPedidoTeste(text)) {
      console.log(`📺 Cliente ${whatsapp} pediu teste de TV`);
      
      // Mostrar lista de servidores
      response = gerarMensagemServidores();
      
      // Salvar stage aguardando escolha
      await saveMessage(whatsapp, 'system', 'Aguardando escolha de servidor TV', null, 'TV Cine Box', 'aguardando_servidor_tv');
      
      skipAI = true;
    }
    
    // Se não interceptou, gerar resposta com IA normalmente
    if (!skipAI) {
      response = await getAgentResponse(messages, whatsapp, name);
    }
    // ============================================
    // FIM DO FLUXO DE TESTE DE TV
    // ============================================
    
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
      // Se a mensagem original era áudio, responder com áudio (Edge TTS)
      if (wasAudio) {
        console.log('Gerando resposta em áudio com Edge TTS...');
        
        // Gerar áudio com ElevenLabs
        const audioBuffer = await textToSpeech(response);
        
        if (audioBuffer) {
          // Enviar áudio via Evolution API (endpoint correto: /message/sendMedia)
          try {
            // Converter buffer para base64
            const base64Audio = audioBuffer.toString('base64');
            const dataUrl = `data:audio/mpeg;base64,${base64Audio}`;
            
            const mediaResponse = await fetch(`${config.evolution.baseUrl}/message/sendMedia/${config.evolution.instanceName}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': config.evolution.apiKey
              },
              body: JSON.stringify({
                number: whatsapp,
                mediatype: 'audio',
                media: dataUrl
              })
            });
            
            if (mediaResponse.ok) {
              console.log('✅ Áudio enviado com sucesso!');
            } else {
              const errData = await mediaResponse.json();
              console.error('Erro ao enviar áudio:', JSON.stringify(errData));
              await sendEvolutionMessage(whatsapp, response);
            }
          } catch (e) {
            console.error('Erro ao enviar áudio:', e.message);
            await sendEvolutionMessage(whatsapp, response);
          }
        } else {
          // Fallback para texto se falhar gerar áudio
          await sendEvolutionMessage(whatsapp, response);
        }
      } else {
        // Resposta em texto normal
        await sendEvolutionMessage(whatsapp, response);
      }
    }
    
    // Se capturou interesse e nome, salvar como lead (só se ainda não foi capturado)
    if (name && interest && conversation.stage !== 'captured') {
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

// Rota de debug - mostra últimas requisições de áudio
let debugLogs = [];
app.get('/api/debug/audio', (req, res) => {
  res.json({ 
    logs: debugLogs.slice(-20),
    groqKey: GROQ_API_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
    edgeTTS: 'CONFIGURADO (gratuito)'
  });
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

// ============================================
// CLIENTS CRUD - PAINEL ADMIN
// ============================================

// Listar todos os clientes
app.get('/api/clients', async (req, res) => {
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query(
        'SELECT * FROM clients ORDER BY created_at DESC'
      );
      res.json(rows);
    } catch (e) {
      console.error('Erro ao listar clientes:', e.message);
      res.json([]);
    }
  } else {
    // Fallback JSON
    const db = loadDB();
    res.json(db.clients || []);
  }
});

// Buscar cliente por ID
app.get('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query(
        'SELECT * FROM clients WHERE id = ?',
        [id]
      );
      if (rows.length > 0) {
        res.json(rows[0]);
      } else {
        res.status(404).json({ error: 'Cliente não encontrado' });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    const db = loadDB();
    const client = (db.clients || []).find(c => c.id == id);
    if (client) {
      res.json(client);
    } else {
      res.status(404).json({ error: 'Cliente não encontrado' });
    }
  }
});

// Criar novo cliente
app.post('/api/clients', async (req, res) => {
  const { 
    name, email, phone, company, plan, monthly_price, agent_prompt,
    evolution_api_url, evolution_api_key, evolution_webhook_url,
    modal_api_key, groq_api_key, elevenlabs_api_key, elevenlabs_voice_id
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  
  // Gerar nome da instância baseado no nome da empresa
  const instanceName = (company || name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20) + '_' + Date.now().toString(36);
  
  if (useMySQL && mysqlPool) {
    try {
      const [result] = await mysqlPool.query(
        `INSERT INTO clients (name, email, phone, company, instance_name, plan, monthly_price, agent_prompt,
          evolution_api_url, evolution_api_key, evolution_webhook_url,
          modal_api_key, groq_api_key, elevenlabs_api_key, elevenlabs_voice_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, email, phone, company, instanceName, plan || 'basic', monthly_price || 99.90, agent_prompt || null,
         evolution_api_url || null, evolution_api_key || null, evolution_webhook_url || null,
         modal_api_key || null, groq_api_key || null, elevenlabs_api_key || null, elevenlabs_voice_id || null]
      );
      
      const clientId = result.insertId;
      
      // Criar instância na Evolution API (usar config do cliente ou padrão)
      const apiUrl = evolution_api_url || EVOLUTION_API_URL;
      const apiKey = evolution_api_key || EVOLUTION_API_KEY;
      const evolutionResult = await createEvolutionInstance(instanceName, apiUrl, apiKey);
      
      // Atualizar com QR Code se disponível
      if (evolutionResult.qrcode) {
        await mysqlPool.query(
          'UPDATE clients SET instance_qrcode = ?, instance_status = ? WHERE id = ?',
          [evolutionResult.qrcode, 'qrcode', clientId]
        );
      }
      
      const [newClient] = await mysqlPool.query('SELECT * FROM clients WHERE id = ?', [clientId]);
      res.json({ success: true, client: newClient[0], evolution: evolutionResult });
    } catch (e) {
      console.error('Erro ao criar cliente:', e.message);
      res.status(500).json({ error: e.message });
    }
  } else {
    // Fallback JSON
    const db = loadDB();
    if (!db.clients) db.clients = [];
    
    const newClient = {
      id: Date.now(),
      name,
      email,
      phone,
      company,
      instance_name: instanceName,
      instance_status: 'pending',
      instance_qrcode: null,
      plan: plan || 'basic',
      monthly_price: monthly_price || 99.90,
      agent_prompt,
      agent_active: true,
      evolution_api_url,
      evolution_api_key,
      evolution_webhook_url,
      modal_api_key,
      groq_api_key,
      elevenlabs_api_key,
      elevenlabs_voice_id,
      created_at: new Date().toISOString()
    };
    
    db.clients.push(newClient);
    saveDB();
    
    // Criar instância na Evolution API
    const evolutionResult = await createEvolutionInstance(instanceName, evolution_api_url, evolution_api_key);
    
    res.json({ success: true, client: newClient, evolution: evolutionResult });
  }
});

// Atualizar cliente
app.put('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    name, email, phone, company, plan, monthly_price, agent_prompt, agent_active,
    evolution_api_url, evolution_api_key, evolution_webhook_url,
    modal_api_key, groq_api_key, elevenlabs_api_key, elevenlabs_voice_id
  } = req.body;
  
  if (useMySQL && mysqlPool) {
    try {
      await mysqlPool.query(
        `UPDATE clients SET name = ?, email = ?, phone = ?, company = ?, plan = ?, monthly_price = ?, 
         agent_prompt = ?, agent_active = ?, evolution_api_url = ?, evolution_api_key = ?, evolution_webhook_url = ?,
         modal_api_key = ?, groq_api_key = ?, elevenlabs_api_key = ?, elevenlabs_voice_id = ? WHERE id = ?`,
        [name, email, phone, company, plan, monthly_price, agent_prompt, agent_active,
         evolution_api_url, evolution_api_key, evolution_webhook_url,
         modal_api_key, groq_api_key, elevenlabs_api_key, elevenlabs_voice_id, id]
      );
      
      const [updated] = await mysqlPool.query('SELECT * FROM clients WHERE id = ?', [id]);
      res.json({ success: true, client: updated[0] });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    const db = loadDB();
    const index = (db.clients || []).findIndex(c => c.id == id);
    if (index >= 0) {
      db.clients[index] = { ...db.clients[index], ...req.body, updated_at: new Date().toISOString() };
      saveDB();
      res.json({ success: true, client: db.clients[index] });
    } else {
      res.status(404).json({ error: 'Cliente não encontrado' });
    }
  }
});

// Deletar cliente
app.delete('/api/clients/:id', async (req, res) => {
  const { id } = req.params;
  
  if (useMySQL && mysqlPool) {
    try {
      // Buscar nome da instância antes de deletar
      const [rows] = await mysqlPool.query('SELECT instance_name FROM clients WHERE id = ?', [id]);
      
      if (rows.length > 0) {
        const instanceName = rows[0].instance_name;
        
        // Deletar instância da Evolution API
        await deleteEvolutionInstance(instanceName);
        
        // Deletar do banco
        await mysqlPool.query('DELETE FROM clients WHERE id = ?', [id]);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Cliente não encontrado' });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    const db = loadDB();
    const index = (db.clients || []).findIndex(c => c.id == id);
    if (index >= 0) {
      const instanceName = db.clients[index].instance_name;
      await deleteEvolutionInstance(instanceName);
      db.clients.splice(index, 1);
      saveDB();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Cliente não encontrado' });
    }
  }
});

// ============================================
// EVOLUTION API - GESTÃO DE INSTÂNCIAS
// ============================================

const EVOLUTION_BASE_URL = process.env.EVOLUTION_BASE_URL || 'https://automacao-evolution-api.nfeujb.easypanel.host';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '5BE128D18942-4B09-8AF8-454ADEEB06B1';

// Criar instância na Evolution API
async function createEvolutionInstance(instanceName) {
  try {
    console.log(`Criando instância Evolution: ${instanceName}`);
    
    // Webhook URL para receber mensagens
    const webhookUrl = process.env.WEBHOOK_URL || 'https://claw-toligadonovo.ow2qbi.easypanel.host/webhook/evolution';
    
    const response = await fetch(`${EVOLUTION_BASE_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        instanceName: instanceName,
        webhook: webhookUrl,
        webhook_by_events: true,
        events: ['messages.upsert', 'connection.update', 'qrcode.updated']
      })
    });
    
    const data = await response.json();
    console.log('Evolution API response:', JSON.stringify(data));
    
    // Conectar instância para gerar QR Code
    const connectResponse = await fetch(`${EVOLUTION_BASE_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    const connectData = await connectResponse.json();
    console.log('Connect response:', JSON.stringify(connectData));
    
    return {
      success: true,
      instance: data,
      qrcode: connectData.base64 || connectData.qrcode || null,
      code: connectData.code || null
    };
  } catch (e) {
    console.error('Erro ao criar instância:', e.message);
    return { success: false, error: e.message };
  }
}

// Buscar QR Code da instância
async function getInstanceQRCode(instanceName) {
  try {
    const response = await fetch(`${EVOLUTION_BASE_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    const data = await response.json();
    return {
      success: true,
      qrcode: data.base64 || data.qrcode || null,
      code: data.code || null,
      status: data.status || 'unknown'
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Status da instância
async function getInstanceStatus(instanceName) {
  try {
    const response = await fetch(`${EVOLUTION_BASE_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      const instance = data.find(i => i.name === instanceName);
      if (instance) {
        return {
          success: true,
          status: instance.connectionStatus || 'close',
          owner: instance.ownerJid,
          profileName: instance.profileName
        };
      }
    }
    
    return { success: false, status: 'not_found' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Deletar instância
async function deleteEvolutionInstance(instanceName) {
  try {
    const response = await fetch(`${EVOLUTION_BASE_URL}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    return { success: response.ok };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Rota para buscar QR Code de um cliente
app.get('/api/clients/:id/qrcode', async (req, res) => {
  const { id } = req.params;
  
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query('SELECT instance_name FROM clients WHERE id = ?', [id]);
      
      if (rows.length > 0) {
        const instanceName = rows[0].instance_name;
        const qrData = await getInstanceQRCode(instanceName);
        
        // Atualizar status no banco
        if (qrData.qrcode) {
          await mysqlPool.query(
            'UPDATE clients SET instance_qrcode = ?, instance_status = ? WHERE id = ?',
            [qrData.qrcode, 'qrcode', id]
          );
        }
        
        res.json(qrData);
      } else {
        res.status(404).json({ error: 'Cliente não encontrado' });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(400).json({ error: 'Requer MySQL' });
  }
});

// Rota para status da instância
app.get('/api/clients/:id/status', async (req, res) => {
  const { id } = req.params;
  
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query('SELECT instance_name FROM clients WHERE id = ?', [id]);
      
      if (rows.length > 0) {
        const instanceName = rows[0].instance_name;
        const statusData = await getInstanceStatus(instanceName);
        
        // Atualizar status no banco
        if (statusData.success) {
          await mysqlPool.query(
            'UPDATE clients SET instance_status = ? WHERE id = ?',
            [statusData.status, id]
          );
        }
        
        res.json(statusData);
      } else {
        res.status(404).json({ error: 'Cliente não encontrado' });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(400).json({ error: 'Requer MySQL' });
  }
});

// Rota para listar todas as instâncias Evolution
app.get('/api/evolution/instances', async (req, res) => {
  try {
    const response = await fetch(`${EVOLUTION_BASE_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rota para reconectar instância
app.post('/api/clients/:id/reconnect', async (req, res) => {
  const { id } = req.params;
  
  if (useMySQL && mysqlPool) {
    try {
      const [rows] = await mysqlPool.query('SELECT instance_name FROM clients WHERE id = ?', [id]);
      
      if (rows.length > 0) {
        const instanceName = rows[0].instance_name;
        const qrData = await getInstanceQRCode(instanceName);
        
        if (qrData.qrcode) {
          await mysqlPool.query(
            'UPDATE clients SET instance_qrcode = ?, instance_status = ? WHERE id = ?',
            [qrData.qrcode, 'qrcode', id]
          );
        }
        
        res.json(qrData);
      } else {
        res.status(404).json({ error: 'Cliente não encontrado' });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(400).json({ error: 'Requer MySQL' });
  }
});

// Webhook de notificações do Funcionários IA
app.post('/api/notifications/webhook', async (req, res) => {
  const { type, title, message, data, source } = req.body;
  
  console.log(`🔔 Notificação [${source}]: ${title} - ${message}`);
  
  // Enviar notificação para o WhatsApp do João se for importante
  const config = await loadConfig();
  if (config.evolution?.enabled && config.whatsapp && ['new_client', 'new_lead'].includes(type)) {
    const notifMsg = `🔔 *${title}*\n\n${message}`;
    await sendEvolutionMessage(config.whatsapp, notifMsg);
  }
  
  res.json({ success: true });
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

// ============================================
// ENDPOINTS DE MEMÓRIA DO LIGADINHO
// ============================================

// Criar tabela ligadinho_memoria se não existir (MySQL)
async function initLigadinhoMemoryTable() {
  if (!useMySQL || !mysqlPool) return;
  try {
    const conn = await mysqlPool.getConnection();
    await conn.query(`CREATE TABLE IF NOT EXISTS ligadinho_memoria (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tipo VARCHAR(50) NOT NULL,
      chave VARCHAR(100) NOT NULL UNIQUE,
      valor TEXT NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tipo (tipo),
      INDEX idx_chave (chave)
    )`);
    conn.release();
    console.log('✅ Tabela ligadinho_memoria criada/verificada');
  } catch (e) {
    console.error('❌ Erro ao criar tabela ligadinho_memoria:', e.message);
  }
}
initLigadinhoMemoryTable();

// POST /api/ligadinho/memory - Gravar memória
app.post('/api/ligadinho/memory', async (req, res) => {
  try {
    const { tipo, chave, valor } = req.body;
    if (!tipo || !chave || !valor) {
      return res.status(400).json({ error: 'tipo, chave e valor são obrigatórios' });
    }
    if (useMySQL && mysqlPool) {
      await mysqlPool.execute(
        'INSERT INTO ligadinho_memoria (tipo, chave, valor) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE valor = ?, tipo = ?',
        [tipo, chave, valor, valor, tipo]
      );
      res.json({ success: true, message: 'Memória gravada', chave });
    } else {
      res.status(503).json({ error: 'MySQL não disponível' });
    }
  } catch (error) {
    console.error('Erro ao gravar memória:', error);
    res.status(500).json({ error: 'Erro ao gravar memória' });
  }
});

// GET /api/ligadinho/memory - Ler toda a memória
app.get('/api/ligadinho/memory', async (req, res) => {
  try {
    if (useMySQL && mysqlPool) {
      const [memorias] = await mysqlPool.execute('SELECT * FROM ligadinho_memoria ORDER BY atualizado_em DESC');
      res.json({ success: true, memorias, count: memorias.length });
    } else {
      res.status(503).json({ error: 'MySQL não disponível' });
    }
  } catch (error) {
    console.error('Erro ao ler memória:', error);
    res.status(500).json({ error: 'Erro ao ler memória' });
  }
});

// GET /api/ligadinho/memory/:chave - Buscar memória específica
app.get('/api/ligadinho/memory/:chave', async (req, res) => {
  try {
    const { chave } = req.params;
    if (useMySQL && mysqlPool) {
      const [memorias] = await mysqlPool.execute('SELECT * FROM ligadinho_memoria WHERE chave = ?', [chave]);
      if (memorias.length === 0) {
        return res.status(404).json({ success: false, message: 'Memória não encontrada' });
      }
      res.json({ success: true, memoria: memorias[0] });
    } else {
      res.status(503).json({ error: 'MySQL não disponível' });
    }
  } catch (error) {
    console.error('Erro ao buscar memória:', error);
    res.status(500).json({ error: 'Erro ao buscar memória' });
  }
});

// DELETE /api/ligadinho/memory/:chave - Remover memória
app.delete('/api/ligadinho/memory/:chave', async (req, res) => {
  try {
    const { chave } = req.params;
    if (useMySQL && mysqlPool) {
      await mysqlPool.execute('DELETE FROM ligadinho_memoria WHERE chave = ?', [chave]);
    }
    res.json({ success: true, message: 'Memória removida' });
  } catch (error) {
    console.error('Erro ao remover memória:', error);
    res.status(500).json({ error: 'Erro ao remover memória' });
  }
});

// ENDPOINT PARA LIGADINHO OPENCLAW ENVIAR MENSAGENS
app.post('/api/ligadinho/send', async (req, res) => {
  try {
    const { number, message } = req.body;
    if (!number || !message) {
      return res.status(400).json({ success: false, error: 'number e message são obrigatórios' });
    }
    console.log(`📤 Ligadinho OpenClaw enviando para ${number}: ${message.substring(0, 50)}...`);
    const result = await sendEvolutionMessage(number, message);
    if (result) {
      console.log('✅ Mensagem enviada com sucesso!');
      res.json({ success: true, message: 'Mensagem enviada', to: number });
    } else {
      console.error('❌ Falha ao enviar mensagem');
      res.status(500).json({ success: false, error: 'Falha ao enviar mensagem' });
    }
  } catch (error) {
    console.error('Erro no endpoint Ligadinho send:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ENDPOINT DE ANÁLISE DE COMPROVANTE PIX (Groq Vision)
// ============================================
// POST /api/ligadinho/analyze-pix - Analisa comprovante PIX
app.post('/api/ligadinho/analyze-pix', async (req, res) => {
  try {
    const { imageUrl, imageBase64 } = req.body;
    
    if (!imageUrl && !imageBase64) {
      return res.status(400).json({ 
        success: false, 
        error: 'imageUrl ou imageBase64 é obrigatório' 
      });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return res.status(503).json({ 
        success: false, 
        error: 'Groq API Key não configurada' 
      });
    }

    console.log('🔍 Analisando comprovante PIX com Groq Vision...');

    // Preparar imagem para Groq
    const imageContent = imageBase64 
      ? imageBase64.replace(/^data:image\/\w+;base64,/, '')
      : null;

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analise este comprovante de pagamento PIX e extraia as informações em formato JSON:
            
            Informações necessárias:
            - nome_pagador: Nome completo de quem pagou
            - nome_recebedor: Nome de quem recebeu
            - valor: Valor exato da transação (apenas números e vírgula/ponto)
            - data_pagamento: Data do pagamento
            - hora_pagamento: Hora da transação
            - id_transacao: ID ou código da transação PIX
            - status: Se parece ser um comprovante válido (sim/nao)
            - observacoes: Qualquer observação relevante
            
            Responda APENAS com o JSON, sem explicações.`
          },
          imageContent 
            ? { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageContent}` } }
            : { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: messages,
        temperature: 0.1,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro Groq Vision:', errorData);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao analisar imagem', 
        details: errorData 
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    console.log('✅ Análise Groq Vision completa');
    console.log('Resposta:', content.substring(0, 200));

    // Extrair JSON da resposta (Groq pode envolver em ```json)
    let extractedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = JSON.parse(content);
      }
    } catch (e) {
      // Se não conseguir parsear, retorna o texto
      extractedData = { 
        raw_text: content,
        parse_error: true 
      };
    }

    res.json({ 
      success: true, 
      data: extractedData,
      raw_response: content
    });

  } catch (error) {
    console.error('Erro na análise PIX:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint alternativo para receber dados já extraídos (confirmação manual)
app.post('/api/ligadinho/confirm-pix', async (req, res) => {
  try {
    const { 
      whatsapp_cliente,
      nome_pagador,
      valor,
      data_pagamento,
      id_transacao,
      status_confirmacao
    } = req.body;

    if (!whatsapp_cliente || !valor) {
      return res.status(400).json({ 
        success: false, 
        error: 'whatsapp e valor são obrigatórios' 
      });
    }

    console.log('✅ Comprovante PIX confirmado:', {
      cliente: whatsapp_cliente,
      valor,
      data: data_pagamento
    });

    // Salvar no banco para histórico
    if (useMySQL && mysqlPool) {
      await mysqlPool.execute(
        `INSERT INTO ligadinho_memoria (tipo, chave, valor) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE valor = ?`,
        [
          'pix_confirmado',
          `pix_${whatsapp_cliente}_${Date.now()}`,
          JSON.stringify({
            whatsapp_cliente,
            nome_pagador,
            valor,
            data_pagamento,
            id_transacao,
            status_confirmacao,
            confirmado_em: new Date().toISOString()
          }),
          JSON.stringify({
            whatsapp_cliente,
            nome_pagador,
            valor,
            data_pagamento,
            id_transacao,
            status_confirmacao,
            confirmado_em: new Date().toISOString()
          })
        ]
      );
    }

    // Notificar João (se configurado)
    const config = await loadConfig();
    if (config.evolution?.enabled && config.whatsapp) {
      const notifMsg = `💰 *PIX Confirmado!*\n\n👤 Cliente: ${whatsapp_cliente}\n💵 Valor: R$ ${valor}\n📅 Data: ${data_pagamento}\n🏷️ ID: ${id_transacao || 'N/A'}`;
      await sendEvolutionMessage(config.whatsapp, notifMsg);
    }

    res.json({ 
      success: true, 
      message: 'PIX confirmado e registrado' 
    });

  } catch (error) {
    console.error('Erro ao confirmar PIX:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// SINCRONIZAÇÃO DE MEMÓRIA OPENCLAW ↔ CONTAINER
// ============================================
// POST /api/ligadinho/memory/sync - Sincroniza memória do OpenClaw pro BD
// Recebe memória do Ligadinho (OpenClaw) e salva no MySQL
app.post('/api/ligadinho/memory/sync', async (req, res) => {
  try {
    const { 
      ligadinho_id,        // ID único do Ligadinho (ex: "ligadinho-whatsapp")
      memory_data,         // Objeto com todas as memórias do OpenClaw
      timestamp            // Quando foi gerado
    } = req.body;

    if (!ligadinho_id || !memory_data) {
      return res.status(400).json({ 
        success: false, 
        error: 'ligadinho_id e memory_data são obrigatórios' 
      });
    }

    console.log(`🔄 Sync recebido de ${ligadinho_id} - ${new Date(timestamp).toISOString()}`);

    const synced = [];
    const errors = [];

    // Itera sobre todas as memórias recebidas
    for (const [key, value] of Object.entries(memory_data)) {
      try {
        // Cria chave única: ligadinho:cliente:memoria
        const syncKey = `${ligadinho_id}:${key}`;
        
        // Detecta tipo automaticamente baseado no conteúdo
        let tipo = 'memoria';
        if (key.includes('cliente') || key.includes('lead')) tipo = 'cliente';
        else if (key.includes('preco') || key.includes('valor')) tipo = 'preco';
        else if (key.includes('produto')) tipo = 'produto';
        else if (key.includes('info')) tipo = 'info';
        else if (key.includes('conversa')) tipo = 'conversa';

        // Converte valor pra string se for objeto
        const valorStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

        // Salva/Atualiza no MySQL
        if (useMySQL && mysqlPool) {
          await mysqlPool.execute(
            `INSERT INTO ligadinho_memoria (tipo, chave, valor) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             valor = ?, 
             tipo = ?, 
             atualizado_em = CURRENT_TIMESTAMP`,
            [tipo, syncKey, valorStr, valorStr, tipo]
          );
          synced.push(key);
        }
      } catch (e) {
        errors.push({ key, error: e.message });
      }
    }

    // Registra sync no log
    console.log(`✅ Sync completo: ${synced.length} itens, ${errors.length} erros`);

    res.json({ 
      success: true, 
      message: `Sincronizado ${synced.length} memórias`,
      ligadinho_id,
      synced,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no sync:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/ligadinho/memory/sync/:ligadinho_id - Busca memória sincronizada
// Retorna todas as memórias de um Ligadinho específico
app.get('/api/ligadinho/memory/sync/:ligadinho_id', async (req, res) => {
  try {
    const { ligadinho_id } = req.params;
    
    if (!useMySQL || !mysqlPool) {
      return res.status(503).json({ error: 'MySQL não disponível' });
    }

    const [memorias] = await mysqlPool.execute(
      'SELECT * FROM ligadinho_memoria WHERE chave LIKE ? ORDER BY atualizado_em DESC',
      [`${ligadinho_id}:%`]
    );

    // Converte pro formato JSON limpo
    const memoryData = {};
    memorias.forEach(mem => {
      const key = mem.chave.replace(`${ligadinho_id}:`, '');
      try {
        memoryData[key] = JSON.parse(mem.valor);
      } catch {
        memoryData[key] = mem.valor;
      }
    });

    res.json({
      success: true,
      ligadinho_id,
      memory: memoryData,
      count: memorias.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar sync:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/ligadinho/memory/sync/trigger - Liga OpenClaw chama pro container
// Quando Liga OpenClaw quer forçar um sync
app.post('/api/ligadinho/memory/sync/trigger', async (req, res) => {
  try {
    const { ligadinho_id, direction = 'bidirectional' } = req.body;
    
    // direction: 'to_container' (OpenClaw → BD) ou 'bidirectional' 
    
    console.log(`🔄 Trigger de sync recebido: ${ligadinho_id} | Direção: ${direction}`);
    
    // Busca memórias atuais do BD
    const [memorias] = useMySQL && mysqlPool 
      ? await mysqlPool.execute(
          'SELECT chave, valor FROM ligadinho_memoria WHERE chave LIKE ? ORDER BY atualizado_em DESC',
          [`${ligadinho_id}:%`]
        )
      : [[]];

    const response = {
      success: true,
      action: 'sync_triggered',
      ligadinho_id,
      direction,
      container_memory_count: memorias.length,
      instruction: direction === 'bidirectional' 
        ? 'Lig OpenClaw deve enviar memória via POST /api/ligadinho/memory/sync'
        : 'Modo unidirecional ativo',
      next_step: 'Aguardando memória do OpenClaw...',
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Erro no trigger:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/ligadinho/memory/sync - Busca com query parameter (evita conflito SPA)
app.get('/api/ligadinho/memory/sync', async (req, res) => {
  try {
    const { ligadinho_id } = req.query;
    
    if (!ligadinho_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'ligadinho_id query parameter é obrigatório' 
      });
    }
    
    if (!useMySQL || !mysqlPool) {
      return res.status(503).json({ error: 'MySQL não disponível' });
    }

    const [memorias] = await mysqlPool.execute(
      'SELECT * FROM ligadinho_memoria WHERE chave LIKE ? ORDER BY atualizado_em DESC',
      [`${ligadinho_id}:%`]
    );

    // Converte pro formato JSON limpo
    const memoryData = {};
    memorias.forEach(mem => {
      const key = mem.chave.replace(`${ligadinho_id}:`, '');
      try {
        memoryData[key] = JSON.parse(mem.valor);
      } catch {
        memoryData[key] = mem.valor;
      }
    });

    res.json({
      success: true,
      ligadinho_id,
      memory: memoryData,
      count: memorias.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar sync:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
