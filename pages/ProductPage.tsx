
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/db';
import { Pix } from '../services/pix';
import { Product, SiteConfig } from '../types';
import { LeadForm } from '../components/LeadForm';
import { Check, Zap, ShoppingBag, X, ShieldCheck, Clock, Award, Send, Copy } from 'lucide-react';
import QRCode from 'react-qr-code';
import { FloatingWhatsApp } from '../components/FloatingWhatsApp';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';

export const ProductPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [whatsappContact, setWhatsappContact] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (slug) {
        try {
          const found = await db.getProductBySlug(slug);
          const c = await db.getConfig();
          const allP = await db.getProducts();
          setProduct(found);
          setConfig(c);
          setProducts(allP);
          window.scrollTo(0, 0);
        } catch (e) {
          console.error(e);
        }
      }
    };
    loadData();
  }, [slug]);

  const calculateTotalFirstPayment = () => {
      if (!product) return 0;
      let total = product.price;
      if (product.paymentType === 'recurring' && product.setupFee) {
          total += product.setupFee;
      }
      return total;
  };

  const pixPayload = useMemo(() => {
    if (!product || !config) return '';
    const total = calculateTotalFirstPayment();
    const txId = `TOLIGADO${Date.now().toString().slice(-4)}`;
    return Pix.payload({
        key: config.pix.key,
        name: config.pix.beneficiary,
        city: 'Online',
        amount: total,
        txid: txId,
        description: product.title
    });
  }, [product, config]);

  const handleCopyPix = () => {
      navigator.clipboard.writeText(pixPayload);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleSendProof = async () => {
    if (!config || !product) return;
    await db.addOrder(product.title, product.price, customerName || 'Cliente', whatsappContact || '00', {
       isSubscription: product.paymentType === 'recurring',
       billingCycle: product.billingCycle,
       setupFee: product.setupFee
    });
    const message = `Olá, acabei de pagar via PIX: *${product.title}*. Meu nome: *${customerName}*. Segue comprovante.`;
    window.open(`https://wa.me/${config.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`, '_blank');
    setShowPixModal(false);
  };

  if (!product || !config) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando...</div>;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500 selection:text-black">
      <FloatingWhatsApp phoneNumber={config.whatsapp} />
      <SiteHeader />
      
      {showPixModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-md w-full relative">
            <button onClick={() => setShowPixModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-6">Pagamento via PIX</h3>
              <div className="bg-white p-4 rounded-xl mx-auto inline-block mb-6"><QRCode value={pixPayload} size={180} /></div>
              <button onClick={handleCopyPix} className={`w-full py-3 rounded-lg font-bold text-sm mb-6 ${copyFeedback ? 'bg-green-600' : 'bg-cyan-600'}`}>
                {copyFeedback ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO PIX'}
              </button>
              <div className="space-y-4 text-left">
                <input type="text" placeholder="Seu Nome" value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3" />
                <input type="tel" placeholder="Seu WhatsApp" value={whatsappContact} onChange={e=>setWhatsappContact(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3" />
                <button onClick={handleSendProof} className="w-full bg-green-600 py-3 rounded-lg font-bold flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Enviar Comprovante</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img src={product.heroImage} className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">{product.title}</h1>
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">{product.shortDescription}</p>
          <button onClick={() => document.getElementById('checkout')?.scrollIntoView({behavior:'smooth'})} className="px-10 py-5 bg-cyan-600 rounded-full font-bold text-lg hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/40">{product.ctaText}</button>
        </div>
      </header>

      <section className="py-24 bg-black border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Transforme seu negócio</h2>
              <p className="text-gray-400 text-lg leading-relaxed whitespace-pre-line">{product.fullDescription}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                {product.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-gray-900 border border-gray-800">
                    <Check className="text-cyan-500" /> <span className="text-sm font-medium">{f}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="lg:col-span-5 sticky top-24">
             <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800">
                <h3 className="text-2xl font-bold mb-6">Solicitar Orçamento</h3>
                <LeadForm origin={`Produto: ${product.title}`} />
             </div>
          </div>
        </div>
      </section>

      <section id="checkout" className="py-24 bg-gray-950 border-t border-gray-900">
         <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="bg-gray-900 border border-gray-800 p-12 rounded-[40px] shadow-2xl">
               <span className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-4 block">Investimento</span>
               <div className="text-6xl md:text-8xl font-black mb-4">R$ {product.price}</div>
               <p className="text-gray-400 mb-10">Ativação imediata via PIX e suporte exclusivo.</p>
               <button onClick={() => setShowPixModal(true)} className="w-full py-5 bg-white text-black rounded-2xl font-bold text-xl hover:bg-gray-200 transition-all">Contratar Agora</button>
            </div>
         </div>
      </section>

      <SiteFooter config={config} products={products} />
    </div>
  );
};
