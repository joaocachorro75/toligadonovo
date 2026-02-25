// Script para migrar dados do JSON para MySQL
// Executar: DB_HOST=... DB_USER=... DB_PASSWORD=... DB_NAME=... node migrate-to-mysql.cjs

const mysql = require('mysql2/promise');
const fetch = require('node-fetch');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'automacao_toligadobd',
  user: process.env.DB_USER || 'toligadobd',
  password: process.env.DB_PASSWORD || 'Naodigo2306@',
  database: process.env.DB_NAME || 'toligadobd'
};

const API_BASE = 'https://site.to-ligado.com/api';

async function migrate() {
  console.log('🔄 Iniciando migração para MySQL...\n');
  
  let conn;
  try {
    conn = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado ao MySQL!\n');
    
    // Criar tabelas se não existirem
    console.log('📦 Criando tabelas...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS config (
        id INT PRIMARY KEY DEFAULT 1,
        data JSON NOT NULL
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id VARCHAR(50) PRIMARY KEY,
        data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(50) PRIMARY KEY,
        data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        whatsapp VARCHAR(50) NOT NULL,
        name VARCHAR(255),
        stage VARCHAR(50) DEFAULT 'welcome',
        interest VARCHAR(255),
        messages JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_whatsapp (whatsapp)
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS agent_instructions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        keywords TEXT,
        content TEXT NOT NULL,
        priority INT DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabelas criadas!\n');
    
    // Migrar config
    console.log('📋 Migrando config...');
    const configRes = await fetch(`${API_BASE}/config`);
    const config = await configRes.json();
    await conn.query(
      'INSERT INTO config (id, data) VALUES (1, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
      [JSON.stringify(config)]
    );
    console.log('✅ Config migrada!\n');
    
    // Migrar produtos
    console.log('📦 Migrando produtos...');
    const productsRes = await fetch(`${API_BASE}/products`);
    const products = await productsRes.json();
    for (const product of products) {
      await conn.query(
        'INSERT INTO products (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
        [product.id, JSON.stringify(product)]
      );
      console.log(`  ✅ ${product.title}`);
    }
    console.log(`✅ ${products.length} produtos migrados!\n`);
    
    // Migrar posts
    console.log('📝 Migrando posts...');
    const postsRes = await fetch(`${API_BASE}/posts`);
    const posts = await postsRes.json();
    if (posts && posts.length > 0) {
      for (const post of posts) {
        await conn.query(
          'INSERT INTO posts (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
          [post.id, JSON.stringify(post)]
        );
      }
      console.log(`✅ ${posts.length} posts migrados!\n`);
    } else {
      console.log('ℹ️ Nenhum post para migrar.\n');
    }
    
    // Migrar instruções
    console.log('📚 Migrando instruções do Ligadinho...');
    const instructionsRes = await fetch(`${API_BASE}/instructions`);
    const instructions = await instructionsRes.json();
    if (instructions && instructions.length > 0) {
      for (const inst of instructions) {
        await conn.query(
          `INSERT INTO agent_instructions (id, category, title, keywords, content, priority, active) 
           VALUES (?, ?, ?, ?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE 
           category = VALUES(category), 
           title = VALUES(title), 
           keywords = VALUES(keywords), 
           content = VALUES(content), 
           priority = VALUES(priority), 
           active = VALUES(active)`,
          [inst.id, inst.category, inst.title, inst.keywords, inst.content, inst.priority || 0, inst.active !== false]
        );
        console.log(`  ✅ ${inst.title}`);
      }
      console.log(`✅ ${instructions.length} instruções migradas!\n`);
    } else {
      console.log('ℹ️ Nenhuma instrução para migrar.\n');
    }
    
    // Migrar leads
    console.log('👥 Migrando leads...');
    const leadsRes = await fetch(`${API_BASE}/leads`);
    const leads = await leadsRes.json();
    if (leads && leads.length > 0) {
      for (const lead of leads) {
        await conn.query(
          'INSERT INTO leads (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
          [lead.id, JSON.stringify(lead)]
        );
      }
      console.log(`✅ ${leads.length} leads migrados!\n`);
    } else {
      console.log('ℹ️ Nenhum lead para migrar.\n');
    }
    
    // Migrar orders
    console.log('🛒 Migrando pedidos...');
    const ordersRes = await fetch(`${API_BASE}/orders`);
    const orders = await ordersRes.json();
    if (orders && orders.length > 0) {
      for (const order of orders) {
        await conn.query(
          'INSERT INTO orders (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
          [order.id, JSON.stringify(order)]
        );
      }
      console.log(`✅ ${orders.length} pedidos migrados!\n`);
    } else {
      console.log('ℹ️ Nenhum pedido para migrar.\n');
    }
    
    console.log('═══════════════════════════════════════');
    console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('═══════════════════════════════════════\n');
    
    console.log('📊 Resumo:');
    console.log(`  - Config: ✅`);
    console.log(`  - Produtos: ${products.length}`);
    console.log(`  - Posts: ${posts?.length || 0}`);
    console.log(`  - Instruções: ${instructions?.length || 0}`);
    console.log(`  - Leads: ${leads?.length || 0}`);
    console.log(`  - Pedidos: ${orders?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

migrate();
