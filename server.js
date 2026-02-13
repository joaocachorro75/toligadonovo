const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'build')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Data & Uploads setup
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Initial Data Helper
const INITIAL_DATA = {
  config: {
    logoText: 'To-Ligado.com',
    logoColor: '#06b6d4',
    whatsapp: '5591980124904',
    pix: { keyType: 'email', key: 'contato@to-ligado.com', beneficiary: 'To-Ligado Soluções' },
    home: {
      heroTitle: 'Sua Empresa',
      heroHighlight: 'No Futuro Agora',
      heroDescription: 'Soluções digitais completas.',
      servicesTitle: 'Nossas Soluções',
      servicesDescription: 'Tecnologia de ponta.',
      contactTitle: 'Vamos conversar?',
      contactDescription: 'Entre em contato.'
    }
  },
  products: [],
  leads: [],
  orders: []
};

// Database Helpers
const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2));
    return INITIAL_DATA;
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
};

const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- API ROUTES ---

// Config
app.get('/api/config', (req, res) => res.json(readDB().config));
app.post('/api/config', (req, res) => {
  const db = readDB();
  db.config = req.body;
  writeDB(db);
  res.json({ success: true });
});

// Products
app.get('/api/products', (req, res) => res.json(readDB().products));
app.post('/api/products', (req, res) => {
  const db = readDB();
  db.products = req.body; // Expects full array or single add logic handled by client usually, but here replacing list
  writeDB(db);
  res.json({ success: true });
});

// Leads
app.get('/api/leads', (req, res) => res.json(readDB().leads));
app.post('/api/leads', (req, res) => {
  const db = readDB();
  db.leads.unshift(req.body);
  writeDB(db);
  res.json({ success: true });
});
app.delete('/api/leads/:id', (req, res) => {
  const db = readDB();
  db.leads = db.leads.filter(l => l.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});
app.put('/api/leads/:id', (req, res) => {
  const db = readDB();
  const index = db.leads.findIndex(l => l.id === req.params.id);
  if (index !== -1) {
    db.leads[index] = req.body;
    writeDB(db);
  }
  res.json({ success: true });
});

// Orders
app.get('/api/orders', (req, res) => res.json(readDB().orders));
app.post('/api/orders', (req, res) => {
  const db = readDB();
  db.orders.unshift(req.body);
  writeDB(db);
  res.json({ success: true });
});
app.delete('/api/orders/:id', (req, res) => {
  const db = readDB();
  db.orders = db.orders.filter(o => o.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});
app.put('/api/orders/:id', (req, res) => {
  const db = readDB();
  const index = db.orders.findIndex(o => o.id === req.params.id);
  if (index !== -1) {
    db.orders[index] = req.body;
    writeDB(db);
  }
  res.json({ success: true });
});

// Upload
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Auth (Simple)
app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === 'admin' && pass === 'Naodigo2306@') {
    res.json({ success: true, token: 'valid-token' });
  } else {
    res.status(401).json({ success: false });
  }
});

// React Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});