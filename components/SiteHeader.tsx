
// Fix: Added React to imports to resolve namespace error
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Zap, Home, Star, Globe, ChevronRight, Phone } from 'lucide-react';
import { db } from '../services/db';
import { Product, SiteConfig } from '../types';

export const SiteHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const load = async () => {
      const c = await db.getConfig();
      const p = await db.getProducts();
      setConfig(c);
      setProducts(p);
    };
    load();
  }, []);

  // Prevenir scroll do body quando menu está aberto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
             const el = document.getElementById(id);
             if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    } else {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHomeClick = () => {
      setIsMenuOpen(false);
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!config) return null;

  return (
    <>
      <header className="fixed w-full top-0 z-[100] bg-black/90 backdrop-blur-md border-b border-gray-800 h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer relative z-[120]" onClick={handleHomeClick}>
              {config.logoImage ? (
                <img src={config.logoImage} alt={config.logoText} className="h-10 object-contain" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">{config.logoText}</span>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
               <button onClick={handleHomeClick} className="text-gray-300 hover:text-white font-medium text-sm transition-colors">Início</button>
               <button onClick={() => scrollToSection('servicos')} className="text-gray-300 hover:text-white font-medium text-sm transition-colors">Soluções</button>
               <Link to="/dicas" className="text-gray-300 hover:text-white font-medium text-sm transition-colors">Blog</Link>
               <button onClick={() => scrollToSection('contato')} className="text-gray-300 hover:text-white font-medium text-sm transition-colors">Contato</button>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-4 relative z-[120]">
                <button 
                  className="md:hidden text-gray-300 hover:text-white p-2"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                </button>
                <div className="hidden sm:block">
                    <button 
                        onClick={() => scrollToSection('contato')}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-full font-bold text-sm shadow-lg shadow-cyan-900/30"
                    >
                        Falar com Especialista
                    </button>
                </div>
            </div>
          </div>
        </div>
      </header>

      {/* FULL SCREEN MENU OVERLAY */}
      <div className={`fixed inset-0 bg-black/98 backdrop-blur-2xl z-[110] transition-all duration-300 flex flex-col pt-24 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
          <div className="flex-1 overflow-y-auto px-6 pb-10">
              <nav className="space-y-4 max-w-lg mx-auto">
                  <button 
                      onClick={handleHomeClick}
                      className="flex items-center gap-4 w-full p-5 rounded-2xl bg-white/5 border border-white/10"
                  >
                      <Home className="w-6 h-6 text-cyan-500" />
                      <span className="text-xl font-bold text-white">Início</span>
                  </button>
                  
                  <button 
                      onClick={() => scrollToSection('servicos')}
                      className="flex items-center gap-4 w-full p-5 rounded-2xl bg-white/5 border border-white/10"
                  >
                      <Star className="w-6 h-6 text-purple-500" />
                      <span className="text-xl font-bold text-white">Soluções</span>
                  </button>

                  <Link 
                      to="/dicas" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-4 w-full p-5 rounded-2xl bg-white/5 border border-white/10"
                  >
                      <Globe className="w-6 h-6 text-blue-500" />
                      <span className="text-xl font-bold text-white">Blog & Dicas</span>
                  </Link>

                  <button 
                      onClick={() => scrollToSection('contato')}
                      className="flex items-center gap-4 w-full p-5 rounded-2xl bg-white/5 border border-white/10"
                  >
                      <Phone className="w-6 h-6 text-green-500" />
                      <span className="text-xl font-bold text-white">Contato</span>
                  </button>

                  <div className="pt-8">
                      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 px-2">Catálogo</h3>
                      <div className="grid grid-cols-1 gap-2">
                          {products.map(p => (
                              <Link 
                                  key={p.id} 
                                  to={`/produto/${p.slug}`} 
                                  onClick={() => setIsMenuOpen(false)}
                                  className="flex items-center justify-between p-4 rounded-xl hover:bg-white/10 bg-white/5 transition-all"
                              >
                                  <span className="text-gray-300 font-medium">{p.menuTitle}</span>
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                              </Link>
                          ))}
                      </div>
                  </div>
              </nav>
          </div>
          
          <div className="p-6 border-t border-gray-800 text-center text-gray-500 text-sm">
              <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="hover:text-cyan-500 py-2 inline-block">Área do Consultor</Link>
          </div>
      </div>
    </>
  );
};
