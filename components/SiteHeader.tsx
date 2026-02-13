
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
    <header className="fixed w-full top-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer relative z-[60]" onClick={handleHomeClick}>
            {config.logoImage ? (
              <img src={config.logoImage} alt={config.logoText} className="h-10 object-contain" />
            ) : (
              <>
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl md:text-2xl font-bold tracking-tight text-white">{config.logoText}</span>
              </>
            )}
          </div>

          {/* Desktop Navigation (Visible on MD+) */}
          <div className="hidden md:flex items-center gap-8">
             <button onClick={handleHomeClick} className="text-gray-300 hover:text-white font-medium text-sm transition-colors">Início</button>
             <button onClick={() => scrollToSection('servicos')} className="text-gray-300 hover:text-white font-medium text-sm transition-colors">Soluções</button>
             <Link to="/dicas" className="text-gray-300 hover:text-white font-medium text-sm transition-colors">Blog</Link>
             <button onClick={() => scrollToSection('contato')} className="text-gray-300 hover:text-white font-medium text-sm transition-colors">Contato</button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4 relative z-[60]">
              {/* CTA Button */}
              <div className="hidden sm:block">
                  <button 
                      onClick={() => scrollToSection('contato')}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-cyan-900/30 hover:shadow-cyan-900/50"
                  >
                      Falar com Especialista
                  </button>
              </div>

              {/* Hamburger Menu Trigger (Mobile Only or Always if preferred, here used for Overlay) */}
              {/* We keep it visible on mobile, and optionally on desktop if we want access to the full product list overlay */}
              <button 
                className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Menu"
              >
                  {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
              </button>
          </div>
        </div>
      </div>

      {/* FULL SCREEN NAVIGATION OVERLAY (Mobile) */}
      <div className={`fixed inset-0 bg-zinc-950/98 backdrop-blur-xl z-50 flex flex-col pt-24 pb-10 px-6 transition-all duration-300 ease-in-out md:hidden ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
          <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="space-y-8">
                      {/* Section 1: Main Links */}
                      <div className="space-y-2">
                          <button 
                              onClick={handleHomeClick}
                              className="flex items-center gap-4 w-full p-4 rounded-xl bg-white/5 border border-white/5 text-left"
                          >
                              <Home className="w-6 h-6 text-cyan-500" />
                              <span className="text-xl font-bold text-white">Início</span>
                          </button>
                          
                          <button 
                              onClick={() => scrollToSection('servicos')}
                              className="flex items-center gap-4 w-full p-4 rounded-xl bg-white/5 border border-white/5 text-left"
                          >
                              <Star className="w-6 h-6 text-purple-500" />
                              <span className="text-xl font-bold text-white">Serviços & Soluções</span>
                          </button>

                          <Link 
                              to="/dicas" 
                              onClick={() => setIsMenuOpen(false)}
                              className="flex items-center gap-4 w-full p-4 rounded-xl bg-white/5 border border-white/5 text-left"
                          >
                              <Globe className="w-6 h-6 text-blue-500" />
                              <span className="text-xl font-bold text-white">Blog & Dicas</span>
                          </Link>

                          <button 
                              onClick={() => scrollToSection('contato')}
                              className="flex items-center gap-4 w-full p-4 rounded-xl bg-white/5 border border-white/5 text-left"
                          >
                              <Phone className="w-6 h-6 text-green-500" />
                              <span className="text-xl font-bold text-white">Fale Conosco</span>
                          </button>
                      </div>

                      {/* Section 2: Products */}
                      <div>
                          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Nossas Soluções</h3>
                          <div className="space-y-1">
                              {products.map(p => (
                                  <Link 
                                      key={p.id} 
                                      to={`/produto/${p.slug}`} 
                                      onClick={() => setIsMenuOpen(false)}
                                      className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-all"
                                  >
                                      <span className="text-lg font-medium text-gray-400 hover:text-white">{p.menuTitle}</span>
                                      <ChevronRight className="w-4 h-4 text-gray-600" />
                                  </Link>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
              
              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-gray-800 flex justify-between items-center text-gray-500 text-sm">
                  <p>© {config.logoText}</p>
                  <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="hover:text-white">Admin</Link>
              </div>
          </div>
      </div>
    </header>
  );
};
