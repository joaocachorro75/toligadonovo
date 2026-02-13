
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../services/db';
import { Lead, Product, SiteConfig, Order, BlogPost } from '../../types';
import { Trash2, Edit, Save, Plus, ExternalLink, Search, Phone, ShoppingBag, Check, X, Settings, Newspaper, RefreshCcw, Layout, Bell, MessageSquare, Send, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { ImageUpload } from '../../components/ImageUpload';
import { INITIAL_SITE_CONFIG } from '../../services/initialData';

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = () => {
    const path = location.pathname.split('/').pop();
    if (['leads', 'orders', 'content', 'settings', 'blog'].includes(path || '')) {
      return path as 'leads' | 'orders' | 'content' | 'settings' | 'blog';
    }
    return 'leads';
  };

  const activeTab = getTabFromPath();

  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [config, setConfig] = useState<SiteConfig>(INITIAL_SITE_CONFIG);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Test Message State
  const [testPhone, setTestPhone] = useState('');
  const [testSending, setTestSending] = useState(false);
  
  // Connection Status State
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'open' | 'close' | 'error' | null>(null);

  // Editing States
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = async () => {
    try {
        const [l, p, c, o, postsData] = await Promise.all([
            db.getLeads(),
            db.getProducts(),
            db.getConfig(),
            db.getOrders(),
            db.getPosts()
        ]);
        setLeads(l);
        setProducts(p);
        setConfig(c || INITIAL_SITE_CONFIG);
        setOrders(o);
        setPosts(postsData);
    } catch (e) {
        console.error("Error loading admin data", e);
    }
  };

  const handleTabClick = (tab: string) => {
    navigate(`/admin/${tab}`);
  };

  // --- Leads Actions ---
  const handleDeleteLead = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      await db.deleteLead(id);
      refreshData();
    }
  };

  const handleUpdateLeadStatus = async (lead: Lead, status: Lead['status']) => {
    await db.updateLead({ ...lead, status });
    refreshData();
  };

  // --- Orders Actions ---
  const handleDeleteOrder = async (id: string) => {
    if (confirm('Excluir este pedido?')) {
      await db.deleteOrder(id);
      refreshData();
    }
  };

  const handleUpdateOrderStatus = async (order: Order, status: Order['status']) => {
    await db.updateOrder({ ...order, status });
    refreshData();
  };

  const handleSendReminder = async (order: Order) => {
      if (!confirm(`Enviar lembrete de pagamento para ${order.customerName}?`)) return;
      
      const success = await db.sendPaymentReminder(order.id);
      if (success) alert("Mensagem enviada com sucesso!");
      else alert("Erro ao enviar mensagem. Verifique a configuração da Evolution API.");
  };

  // --- Product Actions ---
  const handleStartCreateProduct = () => {
    setIsCreating(true);
    setEditingProduct({
      title: '',
      menuTitle: '',
      slug: '',
      price: 0,
      paymentType: 'one-time',
      setupFee: 0,
      shortDescription: '',
      fullDescription: '',
      ctaText: 'Comprar',
      features: ['Característica 1'], 
      heroImage: ''
    });
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza? Isso removerá o produto do site.')) {
      await db.deleteProduct(id);
      refreshData();
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      if (!editingProduct.title || !editingProduct.slug) {
        alert('Título e Slug são obrigatórios');
        return;
      }

      const prodData = editingProduct as any;
      // Default fallback
      if (!prodData.paymentType) prodData.paymentType = 'one-time';

      if (isCreating) {
        await db.createProduct(editingProduct as Omit<Product, 'id'>);
      } else {
        await db.saveProduct(editingProduct as Product);
      }
      
      setEditingProduct(null);
      setIsCreating(false);
      refreshData();
      alert('Produto salvo com sucesso!');
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    if (!editingProduct?.features) return;
    const newFeatures = [...editingProduct.features];
    newFeatures[index] = value;
    setEditingProduct({ ...editingProduct, features: newFeatures });
  };

  const addFeature = () => {
    if (!editingProduct) return;
    setEditingProduct({ 
      ...editingProduct, 
      features: [...(editingProduct.features || []), ''] 
    });
  };

  const removeFeature = (index: number) => {
    if (!editingProduct?.features) return;
    const newFeatures = editingProduct.features.filter((_, i) => i !== index);
    setEditingProduct({ ...editingProduct, features: newFeatures });
  };

  // --- Blog Actions ---
  const handleStartCreatePost = () => {
    setIsCreating(true);
    setEditingPost({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: '',
      published: true
    });
  };

  const handleDeletePost = async (id: string) => {
    if (confirm('Excluir este post?')) {
      await db.deletePost(id);
      refreshData();
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPost) {
      if (!editingPost.title || !editingPost.content) {
        alert('Título e conteúdo são obrigatórios');
        return;
      }
      if (!editingPost.slug) {
         editingPost.slug = editingPost.title.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');
      }

      if (isCreating) {
        await db.createPost(editingPost as any);
      } else {
        await db.updatePost(editingPost as BlogPost);
      }
      setEditingPost(null);
      setIsCreating(false);
      refreshData();
    }
  };

  // --- Config Actions ---
  const handleSaveConfig = async () => {
    await db.saveConfig(config);
    alert('Configurações salvas!');
  };
  
  const handleCheckConnection = async () => {
      setConnectionStatus('checking');
      const status = await db.checkEvolutionStatus();
      // Evolution standard 'open' means connected
      if (status === 'open') setConnectionStatus('open');
      else if (status === 'close') setConnectionStatus('close');
      else setConnectionStatus('error');
  };

  const handleTestEvolution = async () => {
      if (!testPhone) {
          alert("Digite um número para testar");
          return;
      }
      setTestSending(true);
      const success = await db.sendTestMessage(testPhone);
      setTestSending(false);
      
      if (success) alert("Mensagem de teste enviada com sucesso! Verifique o WhatsApp.");
      else alert("Falha ao enviar. Verifique a URL, Instância e Token da API.");
  };

  // --- Formatters ---
  const formatPhone = (phone: string) => phone.replace(/(\+55)(\d{2})(\d{5})(\d{4})/, '$1 ($2) $3-$4');
  const whatsappLink = (phone: string) => `https://wa.me/${phone.replace(/\+/g, '')}`;

  // --- Renders ---
  
  const renderLeads = () => {
    const filteredLeads = leads.filter(l => 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.whatsapp.includes(searchTerm)
    );
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-white">Gestão de Leads</h2>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none w-full md:w-64"
            />
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400 min-w-[800px]">
            <thead className="bg-gray-900 text-gray-200">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">WhatsApp</th>
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-6 py-4 font-medium text-white">{lead.name}</td>
                  <td className="px-6 py-4">
                    <a href={whatsappLink(lead.whatsapp)} target="_blank" className="flex items-center gap-2 text-green-400 hover:text-green-300">
                      <Phone className="w-4 h-4" /> {formatPhone(lead.whatsapp)}
                    </a>
                  </td>
                  <td className="px-6 py-4">{lead.originPage}</td>
                  <td className="px-6 py-4">
                    <select value={lead.status} onChange={(e) => handleUpdateLeadStatus(lead, e.target.value as any)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs">
                      <option value="new">Novo</option>
                      <option value="contacted">Contatado</option>
                      <option value="closed">Fechado</option>
                      <option value="lost">Perdido</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDeleteLead(lead.id)} className="p-2 text-red-400 hover:bg-red-900/30 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center">Nenhum lead encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-xl md:text-2xl font-bold text-white">Vendas & Assinaturas</h2>
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400 min-w-[800px]">
            <thead className="bg-gray-900 text-gray-200">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{order.customerName}</div>
                    <a href={whatsappLink(order.customerWhatsapp)} target="_blank" className="text-xs text-green-400 flex items-center gap-1 mt-1">
                       <Phone className="w-3 h-3" /> {formatPhone(order.customerWhatsapp)}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white">{order.productTitle}</div>
                    <div className="text-xs text-cyan-400">R$ {order.productPrice} {order.billingCycle ? '/ ' + (order.billingCycle === 'monthly' ? 'mês' : 'ano') : ''}</div>
                  </td>
                  <td className="px-6 py-4">
                    {order.isSubscription ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-900/30 text-purple-400 text-xs border border-purple-500/30">
                            <RefreshCcw className="w-3 h-3" /> Recorrente
                        </span>
                    ) : (
                        <span className="px-2 py-1 rounded-full bg-gray-700 text-gray-300 text-xs">Único</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select value={order.status} onChange={(e) => handleUpdateOrderStatus(order, e.target.value as any)} className={`bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs font-bold ${order.status === 'active' || order.status === 'approved' ? 'text-green-400' : order.status === 'cancelled' ? 'text-red-400' : 'text-yellow-400'}`}>
                      <option value="pending">Pendente</option>
                      <option value="active">Ativo (Assinatura)</option>
                      <option value="approved">Aprovado (Venda)</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button title="Enviar Lembrete WhatsApp" onClick={() => handleSendReminder(order)} className="p-2 text-green-400 hover:bg-green-900/30 rounded border border-green-900/50"><Bell className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteOrder(order.id)} className="p-2 text-red-400 hover:bg-red-900/30 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center">Nenhuma venda registrada ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBlog = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-bold text-white">Dicas & Blog</h2>
        {!editingPost && (
          <button onClick={handleStartCreatePost} className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-bold flex items-center gap-2 text-sm md:text-base">
            <Plus className="w-5 h-5" /> <span className="hidden md:inline">Nova Dica</span>
          </button>
        )}
      </div>

      {editingPost ? (
        <form onSubmit={handleSavePost} className="bg-gray-800 border border-gray-700 rounded-xl p-4 md:p-6 space-y-6">
           <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">{isCreating ? 'Nova Publicação' : 'Editar Publicação'}</h3>
            <button type="button" onClick={() => { setEditingPost(null); setIsCreating(false); }} className="text-gray-400 hover:text-white">Cancelar</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
               <ImageUpload 
                 label="Imagem de Capa"
                 currentImage={editingPost.coverImage}
                 onImageChange={(url) => setEditingPost({ ...editingPost, coverImage: url })}
               />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
              <input value={editingPost.title} onChange={e => setEditingPost({...editingPost, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" required />
            </div>
             <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Slug (URL Amigável - Deixe vazio para gerar auto)</label>
              <input value={editingPost.slug} onChange={e => setEditingPost({...editingPost, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Resumo (Excerpt)</label>
              <textarea value={editingPost.excerpt} onChange={e => setEditingPost({...editingPost, excerpt: e.target.value})} rows={2} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Conteúdo (Pode usar HTML básico)</label>
              <textarea value={editingPost.content} onChange={e => setEditingPost({...editingPost, content: e.target.value})} rows={15} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono text-sm" />
            </div>
          </div>
           <div className="flex justify-end pt-4">
            <button type="submit" className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Salvar Post
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {posts.map(post => (
             <div key={post.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:border-cyan-500/50">
               <div className="flex items-center gap-4 w-full">
                 <div className="w-16 h-16 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                   <img src={post.coverImage} className="w-full h-full object-cover" />
                 </div>
                 <div className="min-w-0">
                   <h4 className="text-white font-bold truncate">{post.title}</h4>
                   <p className="text-xs text-gray-500 truncate">{post.slug}</p>
                 </div>
               </div>
               <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button onClick={() => { setEditingPost(post); setIsCreating(false); }} className="p-2 bg-gray-700 text-white rounded hover:bg-cyan-600"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDeletePost(post.id)} className="p-2 bg-red-900/20 text-red-400 rounded hover:bg-red-900"><Trash2 className="w-4 h-4" /></button>
               </div>
             </div>
          ))}
          {posts.length === 0 && <div className="text-gray-500 text-center py-10">Nenhuma dica postada ainda.</div>}
        </div>
      )}
    </div>
  );

  const renderContent = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-bold text-white">Páginas e Produtos</h2>
        {!editingProduct && (
          <button onClick={handleStartCreateProduct} className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-bold flex items-center gap-2 text-sm md:text-base">
            <Plus className="w-5 h-5" /> <span className="hidden md:inline">Novo Produto</span>
          </button>
        )}
      </div>
      
      {editingProduct ? (
        <form onSubmit={handleSaveProduct} className="bg-gray-800 border border-gray-700 rounded-xl p-4 md:p-6 space-y-6">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">{isCreating ? 'Criar Novo Produto' : `Editando: ${editingProduct.title}`}</h3>
            <button type="button" onClick={() => { setEditingProduct(null); setIsCreating(false); }} className="text-gray-400 hover:text-white">Cancelar</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
               <ImageUpload 
                 label="Imagem de Capa (Hero)"
                 currentImage={editingProduct.heroImage}
                 onImageChange={(url) => setEditingProduct({ ...editingProduct, heroImage: url })}
               />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Título do Produto (H1)</label>
              <input value={editingProduct.title} onChange={e => setEditingProduct({...editingProduct, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" required placeholder="Ex: Zap Marketing Premium" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Título do Menu</label>
              <input value={editingProduct.menuTitle} onChange={e => setEditingProduct({...editingProduct, menuTitle: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" required placeholder="Ex: Zap Marketing" />
            </div>
            
            {/* PRICING & SUBSCRIPTION CONFIG */}
            <div className="md:col-span-2 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
               <h4 className="text-cyan-400 font-bold mb-4 flex items-center gap-2"><Settings className="w-4 h-4" /> Configuração de Preço e Cobrança</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Cobrança</label>
                    <select 
                      value={editingProduct.paymentType || 'one-time'} 
                      onChange={e => setEditingProduct({...editingProduct, paymentType: e.target.value as any})}
                      className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    >
                      <option value="one-time">Pagamento Único (Venda)</option>
                      <option value="recurring">Assinatura (Recorrente)</option>
                    </select>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Preço (R$)</label>
                    <input type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" required />
                  </div>

                  {editingProduct.paymentType === 'recurring' && (
                    <>
                       <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Ciclo de Cobrança</label>
                        <select 
                          value={editingProduct.billingCycle || 'monthly'} 
                          onChange={e => setEditingProduct({...editingProduct, billingCycle: e.target.value as any})}
                          className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                        >
                          <option value="monthly">Mensal</option>
                          <option value="yearly">Anual</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Taxa de Adesão (Setup) - Opcional</label>
                        <input type="number" step="0.01" value={editingProduct.setupFee || 0} onChange={e => setEditingProduct({...editingProduct, setupFee: parseFloat(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                      </div>
                    </>
                  )}
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Slug (URL)</label>
              <input value={editingProduct.slug} onChange={e => setEditingProduct({...editingProduct, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" required placeholder="ex: zap-marketing" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Descrição Curta (Resumo)</label>
              <input value={editingProduct.shortDescription} onChange={e => setEditingProduct({...editingProduct, shortDescription: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="Aparece nos cards e no subtítulo da página." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Descrição Completa</label>
              <textarea value={editingProduct.fullDescription} onChange={e => setEditingProduct({...editingProduct, fullDescription: e.target.value})} rows={5} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="Texto detalhado sobre o produto." />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">Lista de Benefícios/Características (Features)</label>
              <p className="text-xs text-gray-500 mb-3">Adicione os pontos principais que aparecem com "check" na página do produto.</p>
              {editingProduct.features?.map((feat, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input 
                    value={feat} 
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                    placeholder={`Característica ${idx + 1}`}
                  />
                  <button type="button" onClick={() => removeFeature(idx)} className="text-red-400 hover:bg-gray-700 p-2 rounded"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button type="button" onClick={addFeature} className="text-sm text-cyan-400 hover:text-cyan-300 font-bold mt-1 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Adicionar Item
              </button>
            </div>
            
             <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Texto do Botão (CTA)</label>
              <input value={editingProduct.ctaText} onChange={e => setEditingProduct({...editingProduct, ctaText: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Salvar Produto
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col justify-between group hover:border-cyan-500/50 transition-all">
              <div>
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-lg font-bold text-white">{product.title}</h3>
                </div>
                <div className="w-full h-32 bg-gray-900 rounded-lg mb-4 overflow-hidden border border-gray-700">
                  <img src={product.heroImage} alt={product.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex justify-between items-end mb-4">
                    <div>
                         <p className="text-xs text-gray-500 uppercase font-bold">Preço</p>
                         <div className="text-white font-bold text-xl">R$ {product.price}</div>
                    </div>
                    {product.paymentType === 'recurring' && (
                        <div className="text-right">
                            <p className="text-xs text-purple-400 uppercase font-bold">Assinatura</p>
                            <p className="text-xs text-gray-400">{product.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}</p>
                        </div>
                    )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => { setEditingProduct(product); setIsCreating(false); }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded flex items-center justify-center gap-2 text-sm"
                >
                  <Edit className="w-4 h-4" /> Editar
                </button>
                <button 
                  onClick={() => handleDeleteProduct(product.id)}
                  className="px-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded flex items-center justify-center border border-red-900/50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <a 
                  href={`#/produto/${product.slug}`} 
                  target="_blank"
                  className="px-3 bg-gray-900 hover:bg-black text-gray-400 rounded flex items-center justify-center"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => {
    // Defensive check
    if (!config || !config.home || !config.pix) return <div className="text-white">Carregando configurações...</div>;

    return (
    <div className="max-w-2xl space-y-12 pb-20">

       {/* Evolution API Section */}
       <section className="bg-gray-800 border-2 border-green-500/30 rounded-xl p-4 md:p-8 space-y-6 shadow-lg shadow-green-900/20">
         <div className="flex items-center gap-3 border-b border-gray-700 pb-4 mb-4">
            <MessageSquare className="w-8 h-8 text-green-500 flex-shrink-0" />
            <div className="flex-1">
                 <h3 className="text-xl font-bold text-white">Automação WhatsApp</h3>
                 <p className="text-xs text-gray-400">Evolution API Config</p>
            </div>
            {connectionStatus === 'open' && (
                <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">
                    <Wifi className="w-3 h-3" /> Conectado
                </div>
            )}
            {connectionStatus === 'close' && (
                <div className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">
                    <WifiOff className="w-3 h-3" /> Desconectado
                </div>
            )}
             {connectionStatus === 'error' && (
                <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/30">
                    <X className="w-3 h-3" /> Erro API
                </div>
            )}
         </div>
         
         <div className="flex items-center gap-4 mb-4">
            <label className="text-sm text-gray-300 font-bold">Status:</label>
            <button 
                onClick={() => setConfig({ ...config, evolution: { ...config.evolution!, enabled: !config.evolution?.enabled } })}
                className={`px-4 py-1 rounded-full text-xs font-bold transition-colors ${config.evolution?.enabled ? 'bg-green-600 text-white' : 'bg-red-900/50 text-red-400'}`}
            >
                {config.evolution?.enabled ? 'ATIVADO' : 'DESATIVADO'}
            </button>
         </div>

         <div className="space-y-4">
            <div>
             <label className="block text-sm font-medium text-gray-400 mb-1">URL da API (Evolution)</label>
             <input
               value={config.evolution?.baseUrl || ''}
               onChange={e => setConfig({...config, evolution: { ...config.evolution!, baseUrl: e.target.value }})}
               className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none placeholder-gray-600"
               placeholder="https://api.meudominio.com"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-400 mb-1">Nome da Instância</label>
             <input
               value={config.evolution?.instanceName || ''}
               onChange={e => setConfig({...config, evolution: { ...config.evolution!, instanceName: e.target.value }})}
               className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none"
               placeholder="MinhaInstancia"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-400 mb-1">Token da Instância (API Key)</label>
             <input
               type="password"
               value={config.evolution?.apiKey || ''}
               onChange={e => setConfig({...config, evolution: { ...config.evolution!, apiKey: e.target.value }})}
               className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none"
               placeholder="Token da Instância"
             />
             <p className="text-[10px] text-gray-500 mt-1">Use a API Key específica da Instância, não a Global.</p>
           </div>
           
           <div className="flex gap-4">
                <button 
                    onClick={handleCheckConnection}
                    disabled={connectionStatus === 'checking'}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} /> 
                    {connectionStatus === 'checking' ? 'Verificando...' : 'Verificar Conexão'}
                </button>
           </div>
           
           {/* TEST MESSAGE BLOCK */}
           <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mt-4">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Testar Envio de Mensagem</label>
              <div className="flex gap-2">
                  <input 
                      type="text" 
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="5591999999999"
                      className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                  />
                  <button 
                      onClick={handleTestEvolution}
                      disabled={testSending}
                      className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                     <Send className="w-4 h-4" /> {testSending ? 'Enviando...' : 'Testar'}
                  </button>
              </div>
           </div>
           
           <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <label className="block text-sm font-medium text-gray-400 mb-2">Mensagem de Boas-vindas</label>
                <textarea
                    rows={2}
                    value={config.evolution?.welcomeMessage || ''}
                    onChange={e => setConfig({...config, evolution: { ...config.evolution!, welcomeMessage: e.target.value }})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none text-sm"
                />
                <p className="text-[10px] text-gray-500 mt-1">Variáveis: {'{cliente}'}, {'{produto}'}</p>
           </div>
           <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <label className="block text-sm font-medium text-gray-400 mb-2">Mensagem de Cobrança</label>
                <textarea
                    rows={2}
                    value={config.evolution?.reminderMessage || ''}
                    onChange={e => setConfig({...config, evolution: { ...config.evolution!, reminderMessage: e.target.value }})}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none text-sm"
                />
                <p className="text-[10px] text-gray-500 mt-1">Variáveis: {'{cliente}'}, {'{produto}'}</p>
           </div>
         </div>
       </section>

      {/* Identity Section */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-4 md:p-8 space-y-6">
        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-4 mb-4 flex items-center gap-2">
           <Layout className="w-6 h-6 text-purple-400" /> Identidade Visual
        </h3>
        <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Site (Logo em Texto)</label>
             <input
               value={config.logoText}
               onChange={e => setConfig({...config, logoText: e.target.value})}
               className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none"
             />
           </div>
           <div className="pt-2">
             <ImageUpload
               label="Logo (Imagem Opcional)"
               currentImage={config.logoImage}
               onImageChange={(url) => setConfig({ ...config, logoImage: url })}
             />
           </div>
        </div>
      </section>

      {/* Home Page Texts Section */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-4 md:p-8 space-y-6">
        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-4 mb-4 flex items-center gap-2">
           <Newspaper className="w-6 h-6 text-cyan-400" /> Textos da Home
        </h3>
        
        <div className="space-y-6">
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <h4 className="text-cyan-400 font-bold mb-4 text-sm uppercase tracking-wider">Seção Hero (Topo)</h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Título Principal</label>
                        <input
                        value={config.home.heroTitle}
                        onChange={e => setConfig({...config, home: { ...config.home, heroTitle: e.target.value }})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Texto Destaque (Colorido)</label>
                        <input
                        value={config.home.heroHighlight}
                        onChange={e => setConfig({...config, home: { ...config.home, heroHighlight: e.target.value }})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Descrição do Topo</label>
                        <textarea
                        rows={3}
                        value={config.home.heroDescription}
                        onChange={e => setConfig({...config, home: { ...config.home, heroDescription: e.target.value }})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <h4 className="text-cyan-400 font-bold mb-4 text-sm uppercase tracking-wider">Seção de Serviços</h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Título da Seção</label>
                        <input
                        value={config.home.servicesTitle}
                        onChange={e => setConfig({...config, home: { ...config.home, servicesTitle: e.target.value }})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Subtítulo / Descrição</label>
                        <textarea
                        rows={2}
                        value={config.home.servicesDescription}
                        onChange={e => setConfig({...config, home: { ...config.home, servicesDescription: e.target.value }})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none"
                        />
                    </div>
                </div>
            </div>

             <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <h4 className="text-cyan-400 font-bold mb-4 text-sm uppercase tracking-wider">Seção de Contato</h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Título de Chamada</label>
                        <input
                        value={config.home.contactTitle}
                        onChange={e => setConfig({...config, home: { ...config.home, contactTitle: e.target.value }})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Texto de Incentivo</label>
                        <textarea
                        rows={2}
                        value={config.home.contactDescription}
                        onChange={e => setConfig({...config, home: { ...config.home, contactDescription: e.target.value }})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
      </section>

       {/* WhatsApp Section */}
       <section className="bg-gray-800 border-2 border-green-500/30 rounded-xl p-4 md:p-8 space-y-6 shadow-lg shadow-green-900/20 relative overflow-hidden">
        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-4 mb-4 flex items-center gap-2">
           <Phone className="w-6 h-6 text-green-400" />
           WhatsApp & Contato
        </h3>
        <div>
          <label className="block text-sm font-medium text-green-400 mb-1 font-bold">Número do WhatsApp (Com DDD)</label>
          <input 
            value={config.whatsapp}
            onChange={e => setConfig({...config, whatsapp: e.target.value})}
            className="w-full bg-gray-900 border border-green-500/50 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="5511999999999"
          />
        </div>
      </section>

      {/* PIX Section */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-4 md:p-8 space-y-6">
        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-4 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-yellow-400" />
            Pagamento (PIX)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Chave</label>
            <select 
              value={config.pix?.keyType || 'email'}
              onChange={e => setConfig({...config, pix: { ...config.pix, keyType: e.target.value as any }})}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            >
              <option value="email">E-mail</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="phone">Telefone</option>
              <option value="random">Chave Aleatória</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Chave PIX</label>
            <input 
              value={config.pix?.key || ''}
              onChange={e => setConfig({...config, pix: { ...config.pix, key: e.target.value }})}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Beneficiário</label>
            <input 
              value={config.pix?.beneficiary || ''}
              onChange={e => setConfig({...config, pix: { ...config.pix, beneficiary: e.target.value }})}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            />
          </div>
        </div>
      </section>

      <button 
        onClick={handleSaveConfig}
        className="sticky bottom-6 w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-bold shadow-lg transition-all text-lg border border-cyan-500/50"
      >
        Salvar Configurações
      </button>
    </div>
  )};

  return (
    <AdminLayout>
      {activeTab === 'leads' && renderLeads()}
      {activeTab === 'orders' && renderOrders()}
      {activeTab === 'content' && renderContent()}
      {activeTab === 'blog' && renderBlog()}
      {activeTab === 'settings' && renderSettings()}
    </AdminLayout>
  );
};
