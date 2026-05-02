import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/page-hero/PageHero";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(
  STATIC_PAGE_SEO.duvidasFrequentes,
);

const faqItems = [
  {
    question: "A Credpagos oferece crédito para quais perfis?",
    answer:
      "Atendemos MEI, empresas (PJ) e pessoas físicas (PF), com opções alinhadas ao objetivo e ao momento financeiro de cada cliente.",
  },
  {
    question: "Como funciona a análise de crédito?",
    answer:
      "A análise considera informações cadastrais e financeiras para identificar possibilidades de crédito. A aprovação é mediante avaliação, com condições conforme perfil.",
  },
  {
    question: "Quanto tempo leva para receber uma proposta?",
    answer:
      "O prazo varia conforme o tipo de solicitação e os dados enviados. Nosso time busca conduzir a análise com agilidade e clareza durante todo o processo.",
  },
  {
    question: "Quais documentos podem ser solicitados?",
    answer:
      "Podemos solicitar documentos pessoais, comprovantes e informações da atividade profissional ou da empresa, sempre de acordo com o tipo de crédito solicitado.",
  },
  {
    question: "A Credpagos garante aprovação de crédito?",
    answer:
      "Não. Toda solicitação é sujeita à análise de crédito e às políticas das instituições parceiras. Valores, prazos, taxas e condições podem variar conforme avaliação.",
  },
  {
    question: "Posso solicitar capital de giro para minha empresa?",
    answer:
      "Sim. A Credpagos oferece soluções para capital de giro com foco em manter a operação da empresa com mais segurança e previsibilidade financeira.",
  },
  {
    question: "Existe atendimento para ajudar na escolha da melhor opção?",
    answer:
      "Sim. Nosso atendimento é próximo e consultivo para entender sua necessidade e orientar a escolha de uma solução de crédito mais adequada.",
  },
  {
    question: "Como começo minha solicitação?",
    answer:
      "Você pode iniciar pelo botão Simular Crédito, informando sua necessidade e dados principais para seguirmos com a análise de forma responsável.",
  },
];

export default function DuvidasFrequentesPage() {
  return (
    <>
      <PageHero
        title="Dúvidas Frequentes"
        description="Encontre respostas sobre crédito para MEI, PJ e PF, análise de crédito, prazos e condições da Credpagos."
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Dúvidas Frequentes" },
        ]}
      />

      <section
        id="duvidas-frequentes"
        className="payments-faq-section section-anchor"
      >
        <div className="payments-faq-container">
          <h2 className="payments-faq-title">Perguntas Frequentes</h2>

          <div className="payments-faq-list">
            {faqItems.map((item, index) => (
              <details
                key={`${item.question}-${index}`}
                className="payments-faq-item"
                open={index === 0}
              >
                <summary className="payments-faq-trigger">
                  <span className="payments-faq-question">{item.question}</span>
                  <span className="payments-faq-icon" aria-hidden="true">
                    +
                  </span>
                </summary>

                <div className="payments-faq-content">
                  <div className="payments-faq-content-inner">
                    <div className="payments-faq-divider" />
                    <p>{item.answer}</p>
                  </div>
                </div>
              </details>
            ))}
          </div>

          <div className="payments-faq-cta">
            <Link href="/simular-credito" className="contact-banner__button">
              Simular Crédito
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
