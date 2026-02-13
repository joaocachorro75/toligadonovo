import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { BlogPost, SiteConfig } from '../types';
import { ArrowLeft, Zap } from 'lucide-react';

export const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
        const p = await db.getPosts();
        const c = await db.getConfig();
        setPosts(p);
        setConfig(c);
    };
    loadData();
  }, []);

  if (!config) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500 selection:text-black">
      {/* Nav */}
      <nav className="fixed w-full z-50 py-4 px-4 bg-black/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Voltar para Home</span>
          </Link>
           <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                    <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold tracking-tight">{config.logoText}</span>
            </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Dicas da To-Ligado</h1>
            <p className="text-xl text-gray-400">Insights, tecnologia e estratégias para vender mais.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
                <Link to={`/dicas/${post.slug}`} key={post.id} className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all hover:-translate-y-1">
                    <div className="aspect-video bg-gray-800 overflow-hidden">
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-6">
                        <p className="text-xs text-cyan-400 font-bold mb-2 uppercase tracking-wider">
                            {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                        <h2 className="text-2xl font-bold mb-3 group-hover:text-cyan-400 transition-colors">{post.title}</h2>
                        <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">{post.excerpt}</p>
                    </div>
                </Link>
            ))}
        </div>
        
        {posts.length === 0 && (
            <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
                <p className="text-gray-500">Nenhum conteúdo publicado ainda.</p>
            </div>
        )}
      </div>
    </div>
  );
};