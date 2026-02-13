
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Zap, ShoppingCart, Globe, Smartphone, Palette, Layout, CheckCircle2, RefreshCcw } from 'lucide-react';
import { db } from '../services/db';
import { Product, SiteConfig, BlogPost } from '../types';
import { LeadForm } from '../components/LeadForm';
import { FloatingWhatsApp } from '../components/FloatingWhatsApp';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';

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
      <section className="pt-28 md:pt-40 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full md:w-[1000px] h-[600px] bg-gradient-to-b from-cyan-600/20 to-transparent rounded-full blur-[120px] -z-10" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/50 border border-gray-700 text-cyan-400 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Soluções Digitais & Inteligência Artificial
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-tight">
            {config.home.heroTitle} <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              {config.home.heroHighlight}
            </span>
          </h1>
          
          <p className="text-base md:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed px-4">
            {config.home.heroDescription}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
            <button onClick={() => scrollToSection('servicos')} className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-colors">Ver Soluções</button>
            <button onClick={() => scrollToSection('contato')} className="w-full sm:w-auto px-8 py-4 bg-gray-900 border border-gray-700 text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group">
              Falar com Consultor <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="servicos" className="py-24 bg-gray-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">{config.home.servicesTitle}</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">{config.home.servicesDescription}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group relative bg-gray-900 rounded-3xl p-1 border border-gray-800 hover:border-cyan-500/50 transition-all hover:-translate-y-2 duration-300">
                <div className="bg-gray-900 h-full rounded-[20px] p-8 flex flex-col">
                  <div className="mb-6 flex justify-between items-start">
                    <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                      {getIcon(product.slug)}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{product.title}</h3>
                  <p className="text-gray-400 mb-8 text-sm line-clamp-3 flex-1">{product.shortDescription}</p>
                  <button onClick={() => navigate(`/produto/${product.slug}`)} className="w-full py-3 rounded-xl bg-gray-800 text-white font-semibold text-sm hover:bg-cyan-600 transition-colors">Ver Detalhes</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-24 bg-black border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
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
                    <Link to={`/dicas/${post.slug}`} key={post.id} className="group">
                        <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden mb-4 border border-gray-800 group-hover:border-cyan-500/50 transition-all">
                            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{post.title}</h3>
                        <p className="text-gray-500 text-sm line-clamp-2">{post.excerpt}</p>
                    </Link>
                 ))}
             </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="bg-black/40 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 md:p-16 flex flex-col md:flex-row gap-12 items-center shadow-2xl">
            <div className="flex-1 text-left">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">{config.home.contactTitle}</h2>
              <p className="text-lg text-gray-400 mb-8">{config.home.contactDescription}</p>
            </div>
            <div className="w-full md:w-[400px] bg-gray-900 p-8 rounded-2xl border border-gray-700">
              <LeadForm origin="Home Page" />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter config={config} products={products} />
    </div>
  );
};
