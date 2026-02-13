
import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { SiteConfig } from '../types';

interface SiteFooterProps {
  config: SiteConfig;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ config }) => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="bg-black border-t border-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8">
          
          {/* Logo Simplificado */}
          <div 
            className="flex items-center gap-2 cursor-pointer group opacity-80 hover:opacity-100 transition-opacity" 
            onClick={scrollToTop}
          >
            <div className="p-1.5 bg-gray-800 group-hover:bg-cyan-600 rounded-lg transition-colors">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">{config.logoText}</span>
          </div>

          {/* Links Essenciais de Linha Única */}
          <nav className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
            <button onClick={scrollToTop} className="text-gray-500 hover:text-white text-xs font-medium transition-colors">Início</button>
            <button onClick={() => document.getElementById('servicos')?.scrollIntoView({behavior:'smooth'})} className="text-gray-500 hover:text-white text-xs font-medium transition-colors">Soluções</button>
            <Link to="/dicas" className="text-gray-500 hover:text-white text-xs font-medium transition-colors">Blog</Link>
            <a href={`https://wa.me/${config.whatsapp.replace(/\D/g,'')}`} target="_blank" className="text-gray-500 hover:text-white text-xs font-medium transition-colors">Suporte</a>
            <Link to="/admin" className="text-gray-500 hover:text-cyan-500 text-xs font-bold transition-colors border-l border-gray-800 pl-8">Área Restrita</Link>
          </nav>

          {/* Assinatura de Crédito em Destaque Minimalista */}
          <div className="pt-4 border-t border-gray-900/50 w-full max-w-xs text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-700 font-bold mb-1">Expertise Digital</p>
            <p className="text-gray-500 text-[11px] mb-1">
              Desenvolvido por <a href="https://to-ligado.com" className="text-cyan-500/80 hover:text-cyan-400 font-bold transition-all hover:tracking-wider">To-Ligado.com</a>
            </p>
            <p className="text-gray-600 text-[10px]">
              © {new Date().getFullYear()} {config.logoText}
            </p>
          </div>
          
        </div>
      </div>
    </footer>
  );
};
