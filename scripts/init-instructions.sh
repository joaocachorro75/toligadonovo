#!/bin/bash
# Script para inicializar instruções do Ligadinho
# Execute após o deploy: bash scripts/init-instructions.sh

API_URL="https://site.to-ligado.com/api/instructions"

echo "🎯 Inicializando instruções do Ligadinho..."

# 1. Teste de Internet Ilimitada
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{
  "category": "suporte",
  "title": "Como criar teste de internet ilimitada (TV Cine Box)",
  "keywords": "teste, internet ilimitada, testar, tv cine box, gratis, avaliacao",
  "content": "**Procedimento para criar teste gratuito de internet ilimitada (TV Cine Box):**\n\n1. Acesse o painel de gestão ou solicite ao João\n2. Crie uma conta de teste com validade de 24-48h\n3. Envie as credenciais para o cliente:\n   - URL do app: https://cinebox.com.br (ou app próprio)\n   - Login: email/telefone do cliente\n   - Senha: gerada automaticamente\n4. Instruza o cliente:\n   - Baixar o app na TV/Smartphone\n   - Fazer login com as credenciais\n   - Testar canais e filmes\n5. Após teste, converter para assinatura (R$ 35/mês)\n\n**Importante:** Testes são por tempo limitado. Pergunte se o cliente quer o teste antes de criar.",
  "priority": 10
}'
echo "✅ Instrução 1 criada"

# 2. Suporte TV Cine Box - Problemas comuns
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{
  "category": "suporte",
  "title": "TV Cine Box - Problemas e Soluções Comuns",
  "keywords": "tv cine box, nao funciona, travando, lag, buffering, sem sinal, erro",
  "content": "**Problemas comuns do TV Cine Box e soluções:**\n\n**1. Vídeo travando/buffering:**\n- Verificar velocidade da internet (mínimo 10Mbps)\n- Reiniciar o roteador\n- Trocar servidor nas configurações do app\n\n**2. Sem sinal/canais não carregam:**\n- Verificar se a assinatura está ativa\n- Atualizar o app\n- Tentar outro servidor\n\n**3. Erro de login:**\n- Verificar se a conta não expirou\n- Solicitar nova senha ao suporte\n\n**4. Qualidade ruim:**\n- Verificar configuração de qualidade no app\n- Testar velocidade da internet\n\n**Se não resolver:** Encaminhar para o João com detalhes do problema.",
  "priority": 8
}'
echo "✅ Instrução 2 criada"

# 3. Procedimento de Venda
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{
  "category": "vendas",
  "title": "Fechamento de Venda - Passos",
  "keywords": "fechar venda, finalizar, contrato, pagamento, pix, assinatura",
  "content": "**Passos para fechar uma venda:**\n\n1. **Confirmar interesse:** \"Então, vamos fechar?\"\n2. **Capturar dados:** Nome completo, WhatsApp, email (opcional)\n3. **Enviar link de pagamento:** PIX para suporte@to-ligado.com\n4. **Após pagamento:** Criar conta/serviço\n5. **Enviar credenciais:** Login, senha, instruções de uso\n\n**Dados necessários por produto:**\n- TV Cine Box: Email/WhatsApp do cliente\n- Landing Page: Textos, imagens, domínio\n- Zap Marketing: Número do WhatsApp para conectar\n- Loja Virtual: Produtos, formas de pagamento, frete\n- Blog IA: Nicho, domínio\n- Delivery: Cardápio, horários, área de entrega\n- PdvCel: Apenas WhatsApp do cliente\n- Agente IA: Prompt/FAQs do negócio\n\n**PIX da To-Ligado:** suporte@to-ligado.com",
  "priority": 15
}'
echo "✅ Instrução 3 criada"

# 4. Encaminhar para o João
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{
  "category": "procedimentos",
  "title": "Quando e como encaminhar para o João",
  "keywords": "falar com joao, junior, chefe, dono, reclamacao, problema grave",
  "content": "**Situações que DEVE encaminhar para o João:**\n\n✅ Cliente pediu explicitamente falar com o dono\n✅ Reclamação grave que não consegue resolver\n✅ Problema técnico complexo\n✅ Negociação de preço especial\n✅ Parcerias e B2B\n✅ Cliente insatisfeito quer cancelar\n\n**Como proceder:**\n1. Diga: \"Entendi! Vou passar seu recado para o João. Ele te retorna em breve.\"\n2. Pergunte: \"Qual seu nome e qual o assunto?\"\n3. Encaminhe a mensagem para: **559131975102**\n\n**NÃO encaminhar se:**\n- É uma pergunta simples sobre produtos\n- Você consegue resolver sozinho\n- É apenas uma dúvida de preço",
  "priority": 20
}'
echo "✅ Instrução 4 criada"

# 5. PdvCel - Suporte
curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d '{
  "category": "suporte",
  "title": "PdvCel - Suporte e FAQ",
  "keywords": "pdvcel, pdv, caixa, estoque, venda, mobile, ponto de venda",
  "content": "**PdvCel - Informações de Suporte:**\n\n**Link de acesso:** https://pdvcel.to-ligado.com\n**Trial:** 2 dias grátis\n**Planos:** R$ 29/mês (Iniciante), R$ 59/mês (Profissional), R$ 99/mês (Empresarial)\n\n**Problemas comuns:**\n\n**1. Login não funciona:**\n- Verificar se digitou o WhatsApp corretamente (com DDD)\n- Verificar se a conta não expirou\n\n**2. Produtos não salvam:**\n- Verificar conexão com internet\n- Atualizar a página\n\n**3. Estoque errado:**\n- Verificar vendas registradas\n- Ajustar manualmente no painel\n\n**4. Esqueceu a senha:**\n- Encaminhar para o João para resetar\n\n**Para criar conta:** Acesse pdvcel.to-ligado.com e cadastre-se",
  "priority": 8
}'
echo "✅ Instrução 5 criada"

echo ""
echo "🎉 Instruções inicializadas com sucesso!"
echo "📋 Total: 5 instruções criadas"
