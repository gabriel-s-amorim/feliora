import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";

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

const FALLBACK: Record<
  string,
  { title: string; description: string; sections: Array<{ heading: string; body: string }> }
> = {
  privacidade: {
    title: "Política de Privacidade",
    description: "Como a Feliora trata dados pessoais e cookies (LGPD).",
    sections: [
      {
        heading: "Introdução",
        body: "Esta política descreve como coletamos e usamos dados na loja Feliora. Substitua este texto pelo conteúdo jurídico definitivo.",
      },
      {
        heading: "Dados que coletamos",
        body: "Nome, e-mail, telefone, endereço de entrega e dados necessários ao pagamento processados pelo Mercado Pago.",
      },
      {
        heading: "Cookies",
        body: "Usamos cookies essenciais para carrinho e sessão. Preferências de marketing só com consentimento explícito.",
      },
    ],
  },
  trocas: {
    title: "Trocas e devoluções",
    description: "Política de trocas e devoluções da Feliora.",
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
};

async function loadPage(slug: string): Promise<{
  title: string;
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
      return {
        title: page.title,
        description: page.seo_description || page.seo_title || page.title,
        sections:
          sections.length > 0
            ? sections
            : FALLBACK[slug]?.sections ?? [
                { heading: "", body: "Conteúdo em atualização." },
              ],
      };
    }
  } catch {
    // fallback local
  }
  return FALLBACK[slug] ?? null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return { title: "Página" };
  return {
    title: page.title,
    description: page.description,
  };
}

export default async function ContentPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
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
