-- LGPD: conteúdo completo da Política de Privacidade (editável no admin).
-- Idempotente: atualiza o seed de privacidade se ainda estiver mínimo ou ausente.

insert into public.content_pages (
  slug, title, seo_title, seo_description, page_type, content, is_published, updated_at
)
values (
  'privacidade',
  'Política de Privacidade',
  'Política de Privacidade — Feliora',
  'Como a Feliora trata dados pessoais e cookies, em conformidade com a LGPD.',
  'sections',
  $json${
    "sections": [
      {
        "heading": "1. Quem somos",
        "body": "A Feliora (“nós”, “nossa loja”) opera a loja online em https://feliora.com.br, comercializando moda feminina. Esta Política de Privacidade explica como tratamos dados pessoais em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD) e demais normas aplicáveis."
      },
      {
        "heading": "2. Quais dados coletamos",
        "body": "Coletamos apenas o necessário para operar a loja:\n\n• Cadastro e conta: nome, e-mail, telefone/WhatsApp e senha (armazenada de forma criptografada pelo provedor de autenticação).\n• Pedidos e entrega: endereço, CPF (quando exigido para pagamento/fiscalização do gateway), itens comprados e histórico de pedidos.\n• Pagamento: processado pelo Mercado Pago — não armazenamos número completo de cartão.\n• Navegação: cookies essenciais (carrinho guest, sessão) e, somente com consentimento, cookies de análise/marketing.\n• Marketing: e-mail (e nome, se informado) apenas quando você marca o opt-in explícito na newsletter ou no cadastro."
      },
      {
        "heading": "3. Para que usamos os dados",
        "body": "Tratamos dados para:\n\n• Criar e gerenciar sua conta;\n• Processar pedidos, pagamento, frete e pós-venda;\n• Cumprir obrigações legais e prevenir fraude;\n• Enviar e-mails transacionais (confirmação, pagamento, envio);\n• Enviar comunicações de marketing somente com consentimento prévio e explícito;\n• Melhorar a experiência do site, quando houver consentimento para cookies não essenciais."
      },
      {
        "heading": "4. Bases legais (LGPD)",
        "body": "Utilizamos, conforme o caso: execução de contrato (compra e entrega); cumprimento de obrigação legal; legítimo interesse (segurança, prevenção a abuso), sempre com avaliação de impacto ao titular; e consentimento — em especial para marketing e cookies não essenciais."
      },
      {
        "heading": "5. Cookies",
        "body": "• Essenciais: necessários ao funcionamento (ex.: cookie de sessão do carrinho guest). Não exigem consentimento para operação básica da loja.\n• Análise e marketing: só são ativados se você escolher “Aceitar todos” no banner de cookies. Você pode restringir a “Apenas essenciais” e alterar a preferência depois pelo link “Cookies” no rodapé.\n\nO registro do consentimento de cookies fica no seu navegador (cookie feliora_cookie_consent), com a versão da política."
      },
      {
        "heading": "6. Marketing e opt-in",
        "body": "Inscrições em newsletter ou comunicações promocionais só ocorrem com checkbox desmarcado por padrão e marcação voluntária. Registramos data, origem do consentimento e, quando disponível, IP/user-agent para comprovação. Você pode cancelar a qualquer momento pelo link de descadastrar nos e-mails ou pelo atendimento."
      },
      {
        "heading": "7. Compartilhamento com terceiros",
        "body": "Compartilhamos dados apenas com operadores necessários à loja, sob contrato ou termos adequados:\n\n• Supabase (hospedagem de dados e autenticação);\n• Mercado Pago (pagamento);\n• Melhor Envio (cotação e logística);\n• Brevo (e-mails transacionais e, se você consentir, marketing);\n• Infraestrutura de hospedagem (ex.: Vercel).\n\nNão vendemos seus dados pessoais."
      },
      {
        "heading": "8. Retenção e segurança",
        "body": "Mantemos dados pelo tempo necessário às finalidades (pedidos, obrigações legais e contábeis) ou até você exercer direitos de exclusão quando cabível. Adotamos medidas técnicas e organizacionais razoáveis (acesso restrito, HTTPS, chaves de serviço no servidor). Nenhum sistema é 100% isento de risco."
      },
      {
        "heading": "9. Seus direitos",
        "body": "Você pode solicitar: confirmação de tratamento; acesso; correção; anonimização, bloqueio ou eliminação de dados desnecessários; portabilidade; informação sobre compartilhamentos; revogação de consentimento; e oposição a tratamentos em hipóteses legais.\n\nPara exercer direitos, use o canal de atendimento indicado na loja (e-mail/WhatsApp das configurações) ou a área Minha conta, quando aplicável. Também é possível contatar a Autoridade Nacional de Proteção de Dados (ANPD)."
      },
      {
        "heading": "10. Menores",
        "body": "A loja não é direcionada a menores de 18 anos. Não coletamos intencionalmente dados de crianças ou adolescentes."
      },
      {
        "heading": "11. Atualizações",
        "body": "Podemos atualizar esta política. Alterações relevantes podem exigir novo consentimento de cookies (nova versão). A data de referência desta versão é julho de 2026."
      },
      {
        "heading": "12. Contato",
        "body": "Dúvidas sobre privacidade: utilize o e-mail ou WhatsApp publicados na loja (página Contato / rodapé / configurações da Feliora)."
      }
    ]
  }$json$::jsonb,
  true,
  now()
)
on conflict (slug) do update
set
  title = excluded.title,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  page_type = excluded.page_type,
  content = excluded.content,
  is_published = true,
  updated_at = now();
