import { Product, SiteConfig } from '../types';

export const INITIAL_SITE_CONFIG: SiteConfig = {
  logoText: 'To-Ligado.com',
  logoColor: '#06b6d4', // Cyan-500
  whatsapp: '5591980124904', // Número padrão solicitado
  pix: {
    keyType: 'email',
    key: 'contato@to-ligado.com',
    beneficiary: 'To-Ligado Soluções Digitais'
  },
  home: {
    heroTitle: 'Sua Empresa',
    heroHighlight: 'No Futuro Agora',
    heroDescription: 'Desenvolvemos sites de alta performance, automações de marketing e soluções com IA para escalar o seu negócio. Tudo pronto, hospedado e otimizado para vendas.',
    servicesTitle: 'Nossas Soluções',
    servicesDescription: 'Tecnologia de ponta envelopada em produtos simples de contratar e usar.',
    contactTitle: 'Pronto para o próximo nível?',
    contactDescription: 'Não deixe sua empresa parada no tempo. A tecnologia avança rápido, e nós ajudamos você a liderar o mercado.'
  }
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    slug: 'landing-pages',
    title: 'Landing Pages de Alta Conversão',
    menuTitle: 'Landing Pages',
    shortDescription: 'Páginas que captam leads e vendem sozinhas.',
    fullDescription: 'Desenvolvemos Landing Pages otimizadas para conversão, com design moderno, carregamento ultrarrápido e copywriting persuasivo focado em transformar visitantes em clientes. Ideal para lançamentos, captura de leads e venda direta.',
    price: 497.00,
    heroImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2000',
    features: ['Design Responsivo', 'Alta Velocidade', 'Integração com WhatsApp', 'SEO Otimizado'],
    ctaText: 'Quero Vender Mais'
  },
  {
    id: '2',
    slug: 'zap-marketing',
    title: 'Zap Marketing + Atendente 24h',
    menuTitle: 'Zap Marketing',
    shortDescription: 'Plataforma de envio em massa e atendimento automático.',
    fullDescription: 'Automatize sua comunicação no WhatsApp. Envie mensagens em massa para grupos e contatos e tenha um atendente virtual 24 horas para não perder nenhuma venda. A ferramenta definitiva para escalar seu atendimento.',
    price: 199.90,
    heroImage: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&q=80&w=2000',
    features: ['Envio em Massa', 'Chatbot Inteligente', 'Gestão de Grupos', 'Relatórios de Envio'],
    ctaText: 'Automatizar Agora'
  },
  {
    id: '3',
    slug: 'lojas-virtuais',
    title: 'Lojas Virtuais Profissionais',
    menuTitle: 'Lojas Virtuais',
    shortDescription: 'E-commerce completo e profissional.',
    fullDescription: 'Tenha sua própria loja online profissional. Sistema completo de gestão de produtos, pedidos, pagamentos e entregas. Tudo pronto para você começar a faturar sem depender de marketplaces.',
    price: 1499.00,
    heroImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=2000',
    features: ['Painel de Gestão', 'Integração de Pagamento', 'Cálculo de Frete', 'Design Personalizado'],
    ctaText: 'Montar Minha Loja'
  },
  {
    id: '4',
    slug: 'blogs-ia',
    title: 'Blogs Automáticos com IA',
    menuTitle: 'Blogs IA',
    shortDescription: 'Conteúdo infinito gerado por inteligência artificial.',
    fullDescription: 'Mantenha seu site sempre atualizado e relevante no Google. Nosso sistema cria e posta artigos otimizados para SEO automaticamente utilizando o poder da IA. Ganhe autoridade sem escrever uma linha.',
    price: 89.90,
    heroImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2000',
    features: ['Postagens Diárias', 'SEO Automático', 'Imagens Geradas', 'Zero Esforço Manual'],
    ctaText: 'Ativar Blog Automático'
  },
  {
    id: '5',
    slug: 'sistema-delivery',
    title: 'Sistema de Delivery Completo',
    menuTitle: 'Delivery',
    shortDescription: 'Ideal para restaurantes, lanchonetes e pizzarias.',
    fullDescription: 'Receba pedidos diretamente no WhatsApp ou Painel, sem taxas abusivas de marketplaces. Cardápio digital interativo e gestão de entregas simplificada para modernizar seu restaurante.',
    price: 99.00,
    heroImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=2000',
    features: ['Cardápio Digital', 'Sem Taxas por Pedido', 'Impressão de Pedidos', 'Link Próprio'],
    ctaText: 'Digitalizar Restaurante'
  },
  {
    id: '6',
    slug: 'turbo-combo',
    title: 'Combinação Turbo: LP + Zap',
    menuTitle: 'Combo Turbo',
    shortDescription: 'A dupla perfeita para escalar suas vendas.',
    fullDescription: 'O poder da Landing Page para captar leads somado à automação do Zap Marketing para converter. A estratégia completa para quem quer resultados agressivos e imediatos.',
    price: 597.00,
    heroImage: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=2000',
    features: ['Landing Page Inclusa', '3 Meses de Zap Marketing', 'Configuração Completa', 'Treinamento de Uso'],
    ctaText: 'Quero o Combo'
  },
  {
    id: '7',
    slug: 'design-grafico',
    title: 'Design Gráfico e Identidade',
    menuTitle: 'Design',
    shortDescription: 'Logomarcas, banners e posts para redes sociais.',
    fullDescription: 'Destaque sua marca com um design profissional. Criamos sua identidade visual completa, posts para Instagram, banners para site e materiais impressos com qualidade de agência.',
    price: 150.00,
    heroImage: 'https://images.unsplash.com/photo-1626785774573-4b799312c95d?auto=format&fit=crop&q=80&w=2000',
    features: ['Design Exclusivo', 'Arquivos em Alta', 'Revisões Ilimitadas', 'Formatos Variados'],
    ctaText: 'Solicitar Design'
  }
];