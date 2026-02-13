import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../services/db';
import { Lead, Product, SiteConfig, Order } from '../../types';
import { Trash2, Edit, Save, Plus, ExternalLink, Search, Phone, ShoppingBag, Check, X, Settings } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { ImageUpload } from '../../components/ImageUpload';
import { INITIAL_SITE_CONFIG } from '../../services/initialData';

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = () => {
    const path = location.pathname.split('/').pop();
    if (path === 'leads' || path === 'orders' || path === 'content' || path === 'settings') {
      return path as 'leads' | 'orders' | 'content' | 'settings';
    }
    return 'leads';
  };

  const activeTab = getTabFromPath();

  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<SiteConfig>(INITIAL_SITE_CONFIG);
  const [searchTerm, setSearchTerm] = useState('');

  // Editing States
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = async () => {
    setLeads(await db.getLeads());
    setProducts(await db.getProducts());
    setConfig(await db.getConfig());
    setOrders(await db.getOrders());
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

  // --- Product Actions ---
  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingProduct({
      title: '',
      menuTitle: '',
      slug: '',
      price: 0,
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

  // --- Config Actions ---
  const handleSaveConfig = async () => {
    await db.saveConfig(config);
    alert('Configurações salvas!');
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
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Gestão de Leads</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none w-64"
            />
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-gray-400">
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
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Vendas & Pedidos</h2>
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-900 text-gray-200">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Valor</th>
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
                  <td className="px-6 py-4">{order.productTitle}</td>
                  <td className="px-6 py-4 text-cyan-400 font-bold">R$ {order.productPrice}</td>
                  <td className="px-6 py-4">
                    <select value={order.status} onChange={(e) => handleUpdateOrderStatus(order, e.target.value as any)} className={`bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs font-bold ${order.status === 'approved' ? 'text-green-400' : 'text-yellow-400'}`}>
                      <option value="pending">Pendente</option>
                      <option value="approved">Aprovado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
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

  const renderContent = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Páginas e Produtos</h2>
        {!editingProduct && (
          <button onClick={handleStartCreate} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5" /> Novo Produto
          </button>
        )}
      </div>
      
      {editingProduct ? (
        <form onSubmit={handleSaveProduct} className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-6">
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
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Slug (URL)</label>
              <input value={editingProduct.slug} onChange={e => setEditingProduct({...editingProduct, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" required placeholder="ex: zap-marketing" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Preço (R$)</label>
              <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" required />
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
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
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
                <p className="text-xs text-cyan-400 font-bold uppercase mb-2">Menu: {product.menuTitle}</p>
                <div className="text-white font-bold text-xl mb-4">R$ {product.price}</div>
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

  const renderSettings = () => (
    <div className="max-w-2xl space-y-12">
      {/* WHATSAPP CONFIG SECTION - HIGHLIGHTED */}
      <section className="bg-gray-800 border-2 border-green-500/30 rounded-xl p-8 space-y-6 shadow-lg shadow-green-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <Phone className="w-24 h-24 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-4 mb-4 flex items-center gap-2">
           <Phone className="w-6 h-6 text-green-400" />
           WhatsApp & Contato
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Este número será usado para o botão flutuante, recebimento de leads e envio de comprovantes de PIX.
        </p>
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

      {/* Branding Section */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-8 space-y-6">
        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-4 mb-4">Identidade Visual</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <ImageUpload 
               label="Logomarca (Substitui o Texto)"
               currentImage={config.logoImage}
               onImageChange={(url) => setConfig({ ...config, logoImage: url })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Nome da Empresa (Texto)</label>
            <input 
              value={config.logoText}
              onChange={e => setConfig({...config, logoText: e.target.value})}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Cor Principal (Hex)</label>
            <div className="flex gap-2">
               <input 
                type="color"
                value={config.logoColor}
                onChange={e => setConfig({...config, logoColor: e.target.value})}
                className="h-10 w-10 rounded cursor-pointer bg-transparent"
              />
              <input 
                value={config.logoColor}
                onChange={e => setConfig({...config, logoColor: e.target.value})}
                className="flex-1 bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono uppercase"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Home Page Content Section */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-8 space-y-6">
        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-4 mb-4">Textos da Página Inicial</h3>
        
        <div className="space-y-4">
          <h4 className="font-bold text-cyan-400 text-sm uppercase tracking-wider">Hero Section (Topo)</h4>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Título Principal</label>
            <input 
              value={config.home.heroTitle}
              onChange={e => setConfig({...config, home: { ...config.home, heroTitle: e.target.value }})}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Destaque Colorido</label>
            <input 
              value={config.home.heroHighlight}
              onChange={e => setConfig({...config, home: { ...config.home, heroHighlight: e.target.value }})}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
            <textarea 
              value={config.home.heroDescription}
              onChange={e => setConfig({...config, home: { ...config.home, heroDescription: e.target.value }})}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-700">
           <h4 className="font-bold text-cyan-400 text-sm uppercase tracking-wider">Seção de Serviços</h4>
           <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
            <input 
              value={config.home.servicesTitle}
              onChange={e => setConfig({...config, home: { ...config.home, servicesTitle: e.target.value }})}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
            <input 
              value={config.home.servicesDescription}
              onChange={e => setConfig({...config, home: { ...config.home, servicesDescription: e.target.value }})}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-700">
           <h4 className="font-bold text-cyan-400 text-sm uppercase tracking-wider">Seção de Contato</h4>
           <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
            <input 
              value={config.home.contactTitle}
              onChange={e => setConfig({...config, home: { ...config.home, contactTitle: e.target.value }})}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
            <input 
              value={config.home.contactDescription}
              onChange={e => setConfig({...config, home: { ...config.home, contactDescription: e.target.value }})}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            />
          </div>
        </div>
      </section>

      {/* PIX Section */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-8 space-y-6">
        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-4 mb-4">Pagamento (PIX)</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Chave</label>
            <select 
              value={config.pix.keyType}
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
              value={config.pix.key}
              onChange={e => setConfig({...config, pix: { ...config.pix, key: e.target.value }})}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Beneficiário</label>
            <input 
              value={config.pix.beneficiary}
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
        Salvar Todas as Configurações
      </button>
    </div>
  );
};