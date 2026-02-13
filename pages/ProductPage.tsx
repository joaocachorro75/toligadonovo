import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Product, SiteConfig } from '../types';
import { LeadForm } from '../components/LeadForm';
import { ArrowLeft, Check, Zap, ShoppingBag, X, ShieldCheck, Clock, Award, Send } from 'lucide-react';
import QRCode from 'react-qr-code';
import { FloatingWhatsApp } from '../components/FloatingWhatsApp';

export const ProductPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [whatsappContact, setWhatsappContact] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (slug) {
        const found = await db.getProductBySlug(slug);
        const c = await db.getConfig();
        setProduct(found);
        setConfig(c);
        window.scrollTo(0, 0);
      }
    };
    loadData();
  }, [slug]);

  if (!product || !config) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Carregando...</h2>
        </div>
      </div>
    );
  }

  const handleSendProof = async () => {
    if (!config.whatsapp) return;
    
    // 1. Save Order to Admin
    await db.addOrder(
      product.title,
      product.price,
      customerName || 'Cliente Anônimo',
      whatsappContact || 'Não informado'
    );

    // 2. Open WhatsApp
    const cleaned = config.whatsapp.replace(/\D/g, '');
    const namePart = customerName ? `Meu nome é: *${customerName}*.` : 'Gostaria de informar o pagamento.';
    const message = `Olá, acabei de realizar o pagamento via PIX para o produto: *${product.title}*. ${namePart} Segue o comprovante em anexo.`;
    window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, '_blank');
    
    // 3. Close Modal
    setTimeout(() => setShowPixModal(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500 selection:text-black">
      <FloatingWhatsApp phoneNumber={config.whatsapp} />
      
      {/* Pix Modal */}
      {showPixModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-md w-full relative shadow-2xl shadow-cyan-900/40 transform scale-100 flex flex-col max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowPixModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-cyan-500/30">
                <ShoppingBag className="w-8 h-8 text-cyan-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Pagamento Seguro via PIX</h3>
              <p className="text-gray-400 mb-8 text-sm">Escaneie o QR Code para finalizar sua contratação instantaneamente.</p>
              
              <div className="bg-white p-4 rounded-xl mx-auto inline-block mb-8 shadow-xl">
                 <QRCode value={config.pix.key} size={180} />
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="bg-gray-800 rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:bg-gray-750 border border-gray-700 hover:border-cyan-500/50 transition-colors" onClick={() => navigator.clipboard.writeText(config.pix.key)}>
                  <div className="text-left overflow-hidden">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Chave PIX ({config.pix.keyType})</p>
                    <code className="text-cyan-400 font-mono text-sm truncate block">{config.pix.key}</code>
                  </div>
                  <span className="text-xs font-bold text-gray-400 bg-gray-900 px-2 py-1 rounded border border-gray-700 group-hover:text-white">COPIAR</span>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-4 text-left border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Beneficiário</p>
                  <p className="text-white font-medium text-sm">{config.pix.beneficiary}</p>
                </div>
              </div>

              <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 mb-4 text-left">
                 <p className="text-sm font-bold text-white mb-2 text-center">Confirmar Pagamento</p>
                 <label className="text-xs text-gray-400 block mb-1">Seu Nome</label>
                 <input 
                   type="text" 
                   value={customerName}
                   onChange={(e) => setCustomerName(e.target.value)}
                   className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white text-sm mb-3 focus:border-green-500 focus:outline-none"
                 />
                 <label className="text-xs text-gray-400 block mb-1">Seu WhatsApp</label>
                  <input 
                   type="text" 
                   value={whatsappContact}
                   onChange={(e) => setWhatsappContact(e.target.value)}
                   className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white text-sm mb-3 focus:border-green-500 focus:outline-none"
                   placeholder="(00) 00000-0000"
                 />
                 <button 
                    onClick={handleSendProof}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                 >
                    <Send className="w-4 h-4" /> Enviar Comprovante
                 </button>
              </div>

              <div className="pt-2 border-t border-gray-800">
                 <p className="text-xs text-green-400 flex items-center justify-center gap-2">
                   <ShieldCheck className="w-4 h-4" /> Pagamento Processado com Segurança
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="fixed w-full z-50 py-4 px-4 transition-all duration-300 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group bg-black/50 px-4 py-2 rounded-full border border-white/10 hover:border-white/30">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Voltar</span>
          </Link>
          
           {/* Dynamic Logo in Navbar */}
           <div className="flex items-center gap-2">
              {config.logoImage ? (
                <img src={config.logoImage} alt={config.logoText} className="h-8 md:h-10 object-contain" />
              ) : (
                <>
                  <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold tracking-tight">{config.logoText}</span>
                </>
              )}
            </div>
        </div>
      </nav>

      {/* Immersive Hero */}
      <header className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={product.heroImage} 
            alt={product.title} 
            className="w-full h-full object-cover opacity-40 scale-105 animate-[pulse_10s_ease-in-out_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-80" />
        </div>

        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center pt-20">
          <div className="inline-block mb-6 animate-fade-in-up">
            <span className="px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-[0.2em]">
              Solução Premium
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[0.9] text-white tracking-tighter">
            {product.title}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
            {product.shortDescription}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <button 
              onClick={() => document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold text-lg transition-all shadow-[0_0_40px_rgba(8,145,178,0.4)] hover:shadow-[0_0_60px_rgba(8,145,178,0.6)] hover:-translate-y-1"
            >
              Começar Agora
            </button>
            <button
               onClick={() => document.getElementById('detalhes')?.scrollIntoView({ behavior: 'smooth' })}
               className="px-10 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full font-bold text-lg backdrop-blur-sm transition-all"
            >
              Saber Mais
            </button>
          </div>
        </div>
      </header>

      {/* Trust Bar */}
      <div className="border-y border-gray-900 bg-gray-950/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
           <div className="flex items-center justify-center gap-4 text-gray-400">
             <div className="p-3 rounded-full bg-gray-900 border border-gray-800"><ShieldCheck className="w-6 h-6 text-cyan-500" /></div>
             <div className="text-left"><p className="text-white font-bold">Garantia Total</p><p className="text-xs">Qualidade assegurada</p></div>
           </div>
           <div className="flex items-center justify-center gap-4 text-gray-400">
             <div className="p-3 rounded-full bg-gray-900 border border-gray-800"><Clock className="w-6 h-6 text-cyan-500" /></div>
             <div className="text-left"><p className="text-white font-bold">Entrega Rápida</p><p className="text-xs">Setup em tempo recorde</p></div>
           </div>
           <div className="flex items-center justify-center gap-4 text-gray-400">
             <div className="p-3 rounded-full bg-gray-900 border border-gray-800"><Award className="w-6 h-6 text-cyan-500" /></div>
             <div className="text-left"><p className="text-white font-bold">Suporte Premium</p><p className="text-xs">Atendimento especializado</p></div>
           </div>
        </div>
      </div>

      {/* Main Content Split */}
      <section id="detalhes" className="py-24 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-12 gap-16 items-start">
          
          {/* Content Column */}
          <div className="lg:col-span-7 space-y-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Transforme seu negócio hoje</h2>
              <div className="prose prose-lg prose-invert text-gray-400 leading-relaxed whitespace-pre-line">
                {product.fullDescription}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6 text-white border-l-4 border-cyan-500 pl-4">O que está incluído no pacote:</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {product.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-cyan-500/30 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-gray-300 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sticky Sidebar / Lead Form */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -z-0"></div>
              <h3 className="text-2xl font-bold mb-2 relative z-10">Fale com um Especialista</h3>
              <p className="text-gray-400 mb-8 relative z-10 text-sm">Tem dúvidas sobre como o {product.title} funciona para o seu caso específico? Preencha abaixo.</p>
              <LeadForm origin={`Produto: ${product.title}`} className="relative z-10" />
            </div>
          </div>

        </div>
      </section>

      {/* Checkout / Pricing Banner */}
      <section id="checkout" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-black" />
        
        <div className="max-w-4xl mx-auto px-4 relative z-10">
           <div className="text-center mb-12">
             <h2 className="text-3xl md:text-5xl font-bold mb-4">Investimento Único</h2>
             <p className="text-gray-400">Sem mensalidades escondidas. Transparência total.</p>
           </div>

           <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-[40px] p-10 md:p-16 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             
             <div className="relative z-10">
                <span className="bg-green-500/10 text-green-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 inline-block">Oferta Especial</span>
                
                <div className="flex items-center justify-center gap-1 mb-2">
                   <span className="text-2xl text-gray-500 font-medium">R$</span>
                   <span className="text-7xl md:text-8xl font-black text-white tracking-tighter">
                     {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                   </span>
                   <span className="text-2xl text-gray-500 font-medium self-end mb-4">,00</span>
                </div>
                
                <p className="text-gray-400 mb-10 text-lg">Pagamento via PIX com ativação imediata</p>
                
                <button 
                  onClick={() => setShowPixModal(true)}
                  className="w-full md:w-auto px-16 py-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold text-xl transition-all shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-1"
                >
                  {product.ctaText}
                </button>
                
                <p className="mt-8 text-xs text-gray-500 max-w-sm mx-auto">
                  Ao clicar em contratar, você será direcionado para o pagamento seguro. Garantia de 7 dias ou seu dinheiro de volta.
                </p>
             </div>
           </div>
        </div>
      </section>

      <footer className="bg-black py-10 border-t border-gray-900 text-center">
        <p className="text-gray-600 text-sm">
           Desenvolvido por <a href="https://to-ligado.com" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 font-bold">To-Ligado.com</a>
        </p>
      </footer>
    </div>
  );
};