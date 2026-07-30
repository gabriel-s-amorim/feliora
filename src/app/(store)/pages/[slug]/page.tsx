import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_NAME, SITE_ORIGIN } from "@/shared/const/site";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type ContentPage = {
  slug: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  content: {
    sections?: Array<{ heading?: string; body?: string }>;
  } | null;
};

const PRIVACY_SECTIONS: Array<{ heading: string; body: string }> = [
  {
    heading: "1. Quem somos",
    body: `A ${SITE_NAME} (“nós”, “nossa loja”) opera a loja online em ${SITE_ORIGIN}, comercializando moda feminina. Esta Política de Privacidade explica como tratamos dados pessoais em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD) e demais normas aplicáveis.`,
  },
  {
    heading: "2. Quais dados coletamos",
    body: `Coletamos apenas o necessário para operar a loja:\n\n• Cadastro e conta: nome, e-mail, telefone/WhatsApp e senha (armazenada de forma criptografada pelo provedor de autenticação).\n• Pedidos e entrega: endereço, CPF (quando exigido para pagamento/fiscalização do gateway), itens comprados e histórico de pedidos.\n• Pagamento: processado pelo Mercado Pago — não armazenamos número completo de cartão.\n• Navegação: cookies essenciais (carrinho guest, sessão) e, somente com consentimento, cookies de análise/marketing.\n• Marketing: e-mail (e nome, se informado) apenas quando você marca o opt-in explícito na newsletter ou no cadastro.`,
  },
  {
    heading: "3. Para que usamos os dados",
    body: `Tratamos dados para:\n\n• Criar e gerenciar sua conta;\n• Processar pedidos, pagamento, frete e pós-venda;\n• Cumprir obrigações legais e prevenir fraude;\n• Enviar e-mails transacionais (confirmação, pagamento, envio);\n• Enviar comunicações de marketing somente com consentimento prévio e explícito;\n• Melhorar a experiência do site, quando houver consentimento para cookies não essenciais.`,
  },
  {
    heading: "4. Bases legais (LGPD)",
    body: `Utilizamos, conforme o caso: execução de contrato (compra e entrega); cumprimento de obrigação legal; legítimo interesse (segurança, prevenção a abuso), sempre com avaliação de impacto ao titular; e consentimento — em especial para marketing e cookies não essenciais.`,
  },
  {
    heading: "5. Cookies",
    body: `• Essenciais: necessários ao funcionamento (ex.: cookie de sessão do carrinho guest). Não exigem consentimento para operação básica da loja.\n• Análise e marketing: só são ativados se você escolher “Aceitar todos” no banner de cookies. Você pode restringir a “Apenas essenciais” e alterar a preferência depois pelo link “Cookies” no rodapé.\n\nO registro do consentimento de cookies fica no seu navegador (cookie feliora_cookie_consent), com a versão da política.`,
  },
  {
    heading: "6. Marketing e opt-in",
    body: `Inscrições em newsletter ou comunicações promocionais só ocorrem com checkbox desmarcado por padrão e marcação voluntária. Registramos data, origem do consentimento e, quando disponível, IP/user-agent para comprovação. Você pode cancelar a qualquer momento pelo link de descadastrar nos e-mails ou pelo atendimento.`,
  },
  {
    heading: "7. Compartilhamento com terceiros",
    body: `Compartilhamos dados apenas com operadores necessários à loja, sob contrato ou termos adequados:\n\n• Supabase (hospedagem de dados e autenticação);\n• Mercado Pago (pagamento);\n• Melhor Envio (cotação e logística);\n• Brevo (e-mails transacionais e, se você consentir, marketing);\n• Infraestrutura de hospedagem (ex.: Vercel).\n\nNão vendemos seus dados pessoais.`,
  },
  {
    heading: "8. Retenção e segurança",
    body: `Mantemos dados pelo tempo necessário às finalidades (pedidos, obrigações legais e contábeis) ou até você exercer direitos de exclusão quando cabível. Adotamos medidas técnicas e organizacionais razoáveis (acesso restrito, HTTPS, chaves de serviço no servidor). Nenhum sistema é 100% isento de risco.`,
  },
  {
    heading: "9. Seus direitos",
    body: `Você pode solicitar: confirmação de tratamento; acesso; correção; anonimização, bloqueio ou eliminação de dados desnecessários; portabilidade; informação sobre compartilhamentos; revogação de consentimento; e oposição a tratamentos em hipóteses legais.\n\nPara exercer direitos, use o canal de atendimento indicado na loja (e-mail/WhatsApp das configurações) ou a área Minha conta, quando aplicável. Também é possível contatar a Autoridade Nacional de Proteção de Dados (ANPD).`,
  },
  {
    heading: "10. Menores",
    body: `A loja não é direcionada a menores de 18 anos. Não coletamos intencionalmente dados de crianças ou adolescentes.`,
  },
  {
    heading: "11. Atualizações",
    body: `Podemos atualizar esta política. Alterações relevantes podem exigir novo consentimento de cookies (nova versão). A data de referência desta versão é julho de 2026.`,
  },
  {
    heading: "12. Contato",
    body: `Dúvidas sobre privacidade: utilize o e-mail ou WhatsApp publicados na loja (página Contato / rodapé / configurações da ${SITE_NAME}).`,
  },
];

const FALLBACK: Record<
  string,
  { title: string; description: string; sections: Array<{ heading: string; body: string }> }
> = {
  privacidade: {
    title: "Política de Privacidade",
    description:
      "Como a Feliora coleta, usa e protege dados pessoais e cookies, em conformidade com a LGPD.",
    sections: PRIVACY_SECTIONS,
  },
  trocas: {
    title: "Trocas e devoluções",
    description:
      "Política de trocas e devoluções da Feliora: prazos, condições e como solicitar.",
    sections: [
      {
        heading: "Prazo",
        body: "Você pode solicitar troca ou devolução em até 7 dias corridos após o recebimento, conforme o CDC.",
      },
      {
        heading: "Condições",
        body: "A peça deve estar sem uso, com etiquetas e na embalagem original. Entre em contato pelo atendimento da loja.",
      },
      {
        heading: "Como solicitar",
        body: "Envie um e-mail ou mensagem pelo WhatsApp informado na loja, com o número do pedido e fotos se necessário.",
      },
    ],
  },
  sobre: {
    title: "Sobre a Feliora",
    description:
      "Conheça a Feliora: moda feminina com delicadeza e presença autoral.",
    sections: [
      {
        heading: "Nossa essência",
        body: "A Feliora nasceu para celebrar a moda feminina com delicadeza e presença.",
      },
    ],
  },
  frete: {
    title: "Frete e entregas",
    description:
      "Como funciona o frete na Feliora: cotação no checkout e entrega para todo o Brasil.",
    sections: [
      {
        heading: "Como calcular",
        body: "No checkout, informe seu CEP para ver opções de frete com valores e prazos.",
      },
    ],
  },
};

async function loadPage(slug: string): Promise<{
  title: string;
  seoTitle: string;
  description: string;
  sections: Array<{ heading: string; body: string }>;
} | null> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("content_pages")
      .select("slug, title, seo_title, seo_description, content")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (data) {
      const page = data as ContentPage;
      const sections =
        page.content?.sections
          ?.filter((s) => s.heading || s.body)
          .map((s) => ({
            heading: s.heading ?? "",
            body: s.body ?? "",
          })) ?? [];
      const fallback = FALLBACK[slug];
      return {
        title: page.title,
        seoTitle: page.seo_title || page.title,
        description:
          page.seo_description ||
          fallback?.description ||
          page.seo_title ||
          page.title,
        sections:
          sections.length > 0
            ? sections
            : fallback?.sections ?? [
                { heading: "", body: "Conteúdo em atualização." },
              ],
      };
    }
  } catch {
    // fallback local
  }
  const fallback = FALLBACK[slug];
  if (!fallback) return null;
  return {
    title: fallback.title,
    seoTitle: fallback.title,
    description: fallback.description,
    sections: fallback.sections,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return { title: "Página", robots: { index: false } };
  return buildPageMetadata({
    title: page.seoTitle.includes(SITE_NAME)
      ? page.seoTitle
      : `${page.seoTitle} | ${SITE_NAME}`,
    description: page.description,
    path: `/pages/${slug}`,
  });
}

export default async function ContentPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: page.title, path: `/pages/${slug}` },
        ])}
      />
      <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
        Feliora
      </p>
      <h1 className="mt-4 font-display text-3xl font-light tracking-[0.06em] text-ink sm:text-4xl">
        {page.title}
      </h1>
      <div className="mt-10 space-y-8">
        {page.sections.map((section, index) => (
          <section key={`${section.heading}-${index}`}>
            {section.heading ? (
              <h2 className="font-display text-xl font-light tracking-[0.04em] text-ink">
                {section.heading}
              </h2>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-ink-muted whitespace-pre-line">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
