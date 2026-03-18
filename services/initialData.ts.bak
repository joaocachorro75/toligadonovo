
import { Product, SiteConfig, BlogPost } from '../types';

export const INITIAL_SITE_CONFIG: SiteConfig = {
  logoText: 'To-Ligado.com',
  logoColor: '#06b6d4', // Cyan-500
  whatsapp: '5591980124904', // Número padrão solicitado
  adminPassword: 'admin123', // Default password
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
  },
  evolution: {
    enabled: false,
    baseUrl: 'https://api.evolution-api.com',
    instanceName: 'minha-instancia',
    apiKey: '',
    welcomeMessage: 'Olá! Recebemos seu pedido de *{produto}*. Para ativar, realize o pagamento via PIX.',
    reminderMessage: 'Olá *{cliente}*! Lembrete de renovação da sua assinatura *{produto}*. O vencimento é hoje.'
  }
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '8',
    slug: 'tv-cine-box',
    title: 'TV Cine Box 4K',
    menuTitle: 'TV Online',
    shortDescription: 'Todos os canais, filmes e séries em um só lugar.',
    fullDescription: 'Transforme sua TV, Celular ou Computador em um cinema completo. Tenha acesso a mais de 2.000 canais ao vivo, incluindo esportes, notícias, infantis e adultos (opcional), além de um catálogo on-demand com mais de 10.000 filmes e séries atualizados diariamente. Sem antenas, sem cabos, basta internet.',
    price: 35.00,
    paymentType: 'recurring',
    billingCycle: 'monthly',
    heroImage: 'https://images.unsplash.com/photo-1593784653277-226e3c6a4696?auto=format&fit=crop&q=80&w=2000',
    features: ['+2000 Canais Ao Vivo', 'Filmes e Séries (Netflix, Prime, etc)', 'Qualidade 4K/FHD', 'Sem travamentos (CDN Dedicada)', 'Teste Grátis de 4 horas'],
    ctaText: 'Assinar Agora'
  },
  {
    id: '1',
    slug: 'landing-pages',
    title: 'Landing Pages de Alta Conversão',
    menuTitle: 'Landing Pages',
    shortDescription: 'Páginas que captam leads e vendem sozinhas.',
    fullDescription: 'Desenvolvemos Landing Pages otimizadas para conversão, com design moderno, carregamento ultrarrápido e copywriting persuasivo focado em transformar visitantes em clientes. Ideal para lançamentos, captura de leads e venda direta.',
    price: 497.00,
    paymentType: 'one-time',
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
    paymentType: 'recurring',
    billingCycle: 'monthly',
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
    paymentType: 'one-time',
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
    paymentType: 'recurring',
    billingCycle: 'monthly',
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
    paymentType: 'recurring',
    billingCycle: 'monthly',
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
    paymentType: 'one-time',
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
    paymentType: 'one-time',
    heroImage: 'https://images.unsplash.com/photo-1626785774573-4b799312c95d?auto=format&fit=crop&q=80&w=2000',
    features: ['Design Exclusivo', 'Arquivos em Alta', 'Revisões Ilimitadas', 'Formatos Variados'],
    ctaText: 'Solicitar Design'
  }
];

export const INITIAL_POSTS: BlogPost[] = [
    {
      id: '1',
      title: 'Venda 24h por dia: O Poder da Automação no WhatsApp',
      slug: 'venda-24h-automacao-whatsapp',
      excerpt: 'Descubra como o Zap Marketing pode transformar seu atendimento e triplicar suas vendas sem você tocar no celular.',
      content: 'Você já perdeu uma venda porque demorou para responder um cliente? Isso é mais comum do que parece. No mundo digital, a velocidade é tudo.\n\nCom nossa ferramenta de **Zap Marketing**, você configura um "Atendente Virtual" que trabalha por você 24 horas por dia, 7 dias por semana. Ele responde dúvidas, envia catálogos e até fecha pedidos enquanto você dorme.\n\nAlém disso, o disparo em massa permite que você alcance milhares de clientes antigos com uma única promoção, reaquecendo leads e gerando caixa imediato. Não seja refém do atendimento manual.',
      coverImage: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&q=80&w=1200',
      published: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Site Institucional vs Landing Page: Onde anunciar?',
      slug: 'site-institucional-vs-landing-page',
      excerpt: 'Se você faz tráfego pago (Ads) e joga o cliente na home do seu site, você está jogando dinheiro fora.',
      content: 'Um erro clássico de quem começa a anunciar no Google ou Facebook é direcionar o cliente para a página inicial (Home) do site. O cliente chega lá, vê "Quem Somos", "Missão", "Blog"... e se perde.\n\nUma **Landing Page de Alta Conversão** tem UM único objetivo: VENDER. Ela não tem menu, não tem distrações e guia o visitante por uma jornada persuasiva até o botão de compra.\n\nNossos testes mostram que Landing Pages convertem até 5x mais que sites comuns. Se você quer ROI (Retorno sobre Investimento), pare de usar sites institucionais para vendas.',
      coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
      published: true,
      createdAt: new Date().toISOString()
    },
    {
        id: '3',
        title: 'O Fim da TV a Cabo? Conheça a Revolução do Streaming 4K',
        slug: 'fim-da-tv-a-cabo-revolucao-streaming',
        excerpt: 'Por que pagar R$ 300,00 em pacotes limitados quando você pode ter tudo via internet por uma fração do preço?',
        content: 'O modelo tradicional de TV por assinatura está em colapso. Mensalidades caras, fidelidade abusiva, aparelhos lentos e chuva que derruba o sinal.\n\nA solução **TV Cine Box 4K** da To-Ligado muda esse jogo. Utilizando apenas sua conexão de internet (IPTV/P2P), entregamos mais de 2.000 canais ao vivo (incluindo Premiere, Combate, HBO) e uma biblioteca com mais de 10.000 filmes e séries (Netflix, Prime, Disney+ tudo incluso).\n\nVocê paga um valor simbólico mensal, sem fidelidade, e assiste na sua TV Smart, no celular ou no computador. É a liberdade que você esperava.',
        coverImage: 'https://images.unsplash.com/photo-1593784653277-226e3c6a4696?auto=format&fit=crop&q=80&w=1200',
        published: true,
        createdAt: new Date().toISOString()
    },
    {
        id: '4',
        title: 'Conteúdo Infinito: Como a IA pode manter seu Blog atualizado',
        slug: 'conteudo-infinito-ia-blog',
        excerpt: 'O Google ama conteúdo novo. Mas quem tem tempo de escrever todo dia? Conheça nossa solução de Blogs Automáticos.',
        content: 'Para aparecer na primeira página do Google, você precisa de SEO (Otimização para Mecanismos de Busca). E o pilar do SEO é conteúdo relevante e frequente.\n\nO problema é que contratar redatores é caro e escrever consome tempo. Nossa solução de **Blogs Automáticos com IA** resolve isso. Configuramos robôs inteligentes que pesquisam tendências no seu nicho, escrevem artigos completos, geram imagens exclusivas e postam no seu site automaticamente.\n\nVocê ganha autoridade, atrai tráfego orgânico (gratuito) e foca apenas em atender os clientes que chegam.',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200',
        published: true,
        createdAt: new Date().toISOString()
    }
];