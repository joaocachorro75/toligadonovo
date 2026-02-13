
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/db';
import { BlogPost, SiteConfig, Product } from '../types';
import { LeadForm } from '../components/LeadForm';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | undefined>();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadData = async () => {
        if (slug) {
            const p = await db.getPostBySlug(slug);
            const c = await db.getConfig();
            const allP = await db.getProducts();
            setPost(p);
            setConfig(c);
            setProducts(allP);
        }
    };
    loadData();
  }, [slug]);

  if (!post || !config) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500 selection:text-black font-sans">
       <SiteHeader />

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
            <div className="whitespace-pre-line leading-relaxed">
                {post.content}
            </div>
         </article>

         <div className="mt-20 border-t border-gray-800 pt-12 mb-20">
            <div className="bg-gray-900 rounded-3xl p-8 md:p-12 border border-gray-800 flex flex-col md:flex-row gap-8 items-center">
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

      <SiteFooter config={config} products={products} />
    </div>
  );
};
