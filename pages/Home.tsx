
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Zap, ShoppingCart, Globe, Smartphone, Palette, Layout, CheckCircle2, RefreshCcw, ChevronRight } from 'lucide-react';
import { db } from '../services/db';
import { Product, SiteConfig, BlogPost } from '../types';
import { LeadForm } from '../components/LeadForm';
import { FloatingWhatsApp } from '../components/FloatingWhatsApp';
import { SiteHeader } from '../components/SiteHeader';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const p = await db.getProducts();
        const c = await db.getConfig();
        const blogPosts = await db.getPosts();
        setProducts(p);
        setConfig(c);
        setPosts(blogPosts.slice(0, 3));
      } catch (e) {
        console.error("Failed to load home data", e);
      }
    };
    loadData();
  }, []);

  const getIcon = (slug: string) => {
    switch (slug) {
      case 'landing-pages': return <Layout className="w-8 h-8 text-cyan-400" />;
      case 'zap-marketing': return <Smartphone className="w-8 h-8 text-green-400" />;
      case 'lojas-virtuais': return <ShoppingCart className="w-8 h-8 text-purple-400" />;
      case 'blogs-ia': return <Globe className="w-8 h-8 text-blue-400" />;
      case 'sistema-delivery': return <Star className="w-8 h-8 text-yellow-400" />;
      case 'turbo-combo': return <Zap className="w-8 h-8 text-red-400" />;
      case 'design-grafico': return <Palette className="w-8 h-8 text-pink-400" />;
      default: return <Star className="w-8 h-8 text-white" />;
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  if (!config) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500 selection:text-black">
      <FloatingWhatsApp phoneNumber={config.whatsapp} />
      
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-cyan-600/20 to-transparent rounded-full blur-[120px] -z-10" />
        <div className="absolute top-40 right-10 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] -z-10" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/50 border border-gray-700 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Soluções Digitais & Inteligência Artificial
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-tight">
            {config.home.heroTitle} <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              {config.home.heroHighlight}
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            {config.home.heroDescription}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => scrollToSection('servicos')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              Ver Soluções
            </button>
            <button 
              onClick={() => scrollToSection('contato')}
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 border border-gray-700 text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group"
            >
              Falar com Consultor <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Stats / Trust */}
          <div className="mt-20 pt-10 border-t border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-70">
            {[
              { label: 'Projetos Entregues', val: '+500' },
              { label: 'Leads Captados', val: '+1M' },
              { label: 'Satisfação', val: '99%' },
              { label: 'Suporte', val: '24/7' }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.val}</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="servicos" className="py-24 bg-gray-950 relative">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">{config.home.servicesTitle}</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">{config.home.servicesDescription}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group relative bg-gray-900 rounded-3xl p-1 border border-gray-800 hover:border-cyan-500/50 transition-all hover:-translate-y-2 duration-300">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                
                <div className="bg-gray-900 h-full rounded-[20px] p-8 relative overflow-hidden flex flex-col">
                  <div className="mb-6 flex justify-between items-start">
                    <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                      {getIcon(product.slug)}
                    </div>
                    {product.paymentType === 'recurring' && (
                        <div className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1">
                            <RefreshCcw className="w-3 h-3" /> Assinatura
                        </div>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3 leading-tight">
                    {product.title}
                  </h3>
                  <p className="text-gray-400 mb-8 text-sm leading-relaxed min-h-[60px]">
                    {product.shortDescription}
                  </p>
                  
                  <div className="space-y-3 mb-8 flex-1">
                    {product.features.slice(0, 3).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle2 className="w-3 h-3 text-cyan-500" />
                        {f}
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => navigate(`/produto/${product.slug}`)}
                    className="w-full py-3 rounded-xl bg-gray-800 text-white font-semibold text-sm hover:bg-cyan-600 transition-colors"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section (Latest Tips) */}
      <section className="py-24 bg-black border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4">
             <div className="flex justify-between items-end mb-12">
                <div>
                     <h2 className="text-3xl font-bold text-white mb-4">Dicas da To-Ligado</h2>
                     <p className="text-gray-400">Conteúdo estratégico para crescer seu negócio.</p>
                </div>
                <Link to="/dicas" className="text-cyan-400 font-bold hover:text-white transition-colors flex items-center gap-2">
                    Ver tudo <ArrowRight className="w-4 h-4" />
                </Link>
             </div>

             <div className="grid md:grid-cols-3 gap-8">
                 {posts.map(post => (
                    <Link to={`/dicas/${post.slug}`} key={post.id} className="group cursor-pointer">
                        <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden mb-4 border border-gray-800 group-hover:border-cyan-500/50 transition-all">
                            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{post.title}</h3>
                        <p className="text-gray-500 text-sm line-clamp-2">{post.excerpt}</p>
                    </Link>
                 ))}
                 {posts.length === 0 && (
                     <div className="col-span-3 text-center py-10 bg-gray-900 rounded-xl text-gray-500">
                         Em breve, novidades incríveis por aqui.
                     </div>
                 )}
             </div>
        </div>
      </section>

      {/* CTA / Footer Lead Form */}
      <section id="contato" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-900">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-gray-900 to-black opacity-80" />
          <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=2000" alt="Background" className="w-full h-full object-cover opacity-10 mix-blend-overlay" />
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="bg-black/40 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 md:p-16 flex flex-col md:flex-row gap-16 items-center shadow-2xl">
            <div className="flex-1 text-left">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-cyan-900/40">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{config.home.contactTitle}</h2>
              <p className="text-xl text-gray-400 mb-8">{config.home.contactDescription}</p>
              <div className="flex gap-4 text-sm text-gray-500">
                 <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /> Atendimento Humano</div>
                 <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /> Setup Rápido</div>
              </div>
            </div>
            
            <div className="w-full md:w-[450px] bg-gray-900 p-8 rounded-2xl border border-gray-700 shadow-xl">
               <h3 className="text-xl font-bold text-white mb-2">Fale com a gente</h3>
               <p className="text-gray-400 text-sm mb-6">Preencha e receba contato via WhatsApp.</p>
              <LeadForm origin="Home Page" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-16 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
             {config.logoImage ? (
                <img src={config.logoImage} alt={config.logoText} className="h-8 object-contain opacity-50 grayscale hover:grayscale-0 transition-all" />
              ) : (
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-gray-900 rounded-lg border border-gray-800">
                     <Zap className="w-6 h-6 text-cyan-500" />
                   </div>
                   <span className="text-xl font-bold text-white tracking-tight">{config.logoText}</span>
                </div>
              )}
          </div>
          
          <div className="text-gray-500 text-sm text-center md:text-right">
            <p className="mb-2">© {new Date().getFullYear()} Todos os direitos reservados.</p>
            <div className="mb-2">
              Desenvolvido por <a href="https://to-ligado.com" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 font-bold">To-Ligado.com</a>
            </div>
            <div className="flex gap-6 justify-center md:justify-end">
               <Link to="/admin" className="hover:text-cyan-500 transition-colors">Admin</Link>
               <button onClick={() => {}} className="hover:text-cyan-500 transition-colors cursor-pointer">Termos</button>
               <button onClick={() => {}} className="hover:text-cyan-500 transition-colors cursor-pointer">Privacidade</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
