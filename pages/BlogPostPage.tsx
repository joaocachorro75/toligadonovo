import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/db';
import { BlogPost, SiteConfig } from '../types';
import { ArrowLeft, Zap } from 'lucide-react';
import { LeadForm } from '../components/LeadForm';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | undefined>();
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    const loadData = async () => {
        if (slug) {
            const p = await db.getPostBySlug(slug);
            const c = await db.getConfig();
            setPost(p);
            setConfig(c);
        }
    };
    loadData();
  }, [slug]);

  if (!post || !config) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500 selection:text-black font-sans">
       {/* Nav */}
       <nav className="fixed w-full z-50 py-4 px-4 bg-black/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/dicas" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Voltar para Dicas</span>
          </Link>
           <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-500" />
                <span className="font-bold tracking-tight">{config.logoText}</span>
            </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
         <header className="text-center mb-12">
            <div className="inline-block px-3 py-1 bg-gray-900 rounded-full text-xs text-gray-400 mb-4 border border-gray-800">
                {new Date(post.createdAt).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">{post.title}</h1>
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-gray-800">
                <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
         </header>

         <article className="prose prose-invert prose-lg max-w-none text-gray-300">
            <p className="text-xl text-white font-medium leading-relaxed mb-8 border-l-4 border-cyan-500 pl-4">{post.excerpt}</p>
            {/* Simple rendering of content - preserving newlines */}
            <div className="whitespace-pre-line">
                {post.content}
            </div>
         </article>

         <div className="mt-20 border-t border-gray-800 pt-12">
            <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">Gostou da dica?</h3>
                    <p className="text-gray-400 mb-4">Receba uma consultoria gratuita para aplicar essas estratégias no seu negócio.</p>
                </div>
                <div className="w-full md:w-80">
                    <LeadForm origin={`Blog Post: ${post.title}`} btnColor="bg-cyan-600 hover:bg-cyan-500" />
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};