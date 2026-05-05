"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const showcaseTabs = [
  {
    id: "credito",
    label: "Crédito",
    title: "Crédito para MEI, PJ e PF",
    description:
      "A Credpagos facilita o acesso ao empréstimo com análise simples e atendimento próximo para cada perfil.",
    image: "/assets/img/home/img-03.jpg",
    points: [
      "Soluções para pessoa física, microempreendedores e empresas",
      "Condições conforme avaliação de perfil",
      "Processo com menos burocracia e mais transparência",
    ],
  },
  {
    id: "analise",
    label: "Análise",
    title: "Análise responsável",
    description:
      "Avaliamos cada solicitação com clareza para apresentar valor, prazo e taxa de forma objetiva.",
    image: "/assets/img/home/img-05.png",
    points: [
      "Aprovação mediante avaliação",
      "Condições alinhadas ao momento financeiro",
      "Suporte para decisão com segurança",
    ],
  },
  {
    id: "consultoria",
    label: "Consultoria",
    title: "Atendimento com orientação",
    description:
      "Nosso time acompanha cada etapa para ajudar na escolha da melhor solução de crédito.",
    image:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80",
    points: [
      "Atendimento humanizado",
      "Mais clareza sobre condições e documentação",
      "Jornada segura do inicio ao fim",
    ],
  },
];

const showcaseStats = [
  { value: "09", label: "solucoes no portfolio" },
  { value: "MEI/PJ/PF", label: "perfis atendidos" },
  { value: "24/7", label: "canais de atendimento" },
  { value: "+", label: "segurança e transparência" },
];

export default function ProductsShowcase() {
  const [activeTab, setActiveTab] = useState(showcaseTabs[0].id);

  const activeContent =
    showcaseTabs.find((item) => item.id === activeTab) ?? showcaseTabs[0];

  return (
    <section id="produtos" className="financial-showcase section-anchor">
      <div className="financial-showcase-shell">
        <div className="financial-showcase-top">
          <div className="financial-showcase-media">
            <Image
              src={activeContent.image}
              alt={activeContent.title}
              fill
              className="financial-showcase-image"
              sizes="(max-width: 991px) 100vw, 50vw"
            />
          </div>

          <div className="financial-showcase-content">
            <h2 className="financial-showcase-title">{activeContent.title}</h2>

            <div
              className="financial-showcase-tabs"
              role="tablist"
              aria-label="Abas de produtos da Credpagos"
            >
              {showcaseTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={cn(
                    "financial-showcase-tab",
                    activeTab === tab.id && "is-active",
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <p className="financial-showcase-description">
              {activeContent.description}
            </p>

            <div className="financial-showcase-points">
              {activeContent.points.map((point) => (
                <div key={point} className="financial-showcase-point">
                  <CheckCircle2 size={18} strokeWidth={2.4} />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <Link href="/simular-credito" className="financial-showcase-button">
              Simular Crédito
            </Link>
          </div>
        </div>

        <div className="financial-showcase-stats">
          {showcaseStats.map((item) => (
            <article key={item.label} className="financial-showcase-stat">
              <p className="financial-showcase-stat-value">{item.value}</p>
              <p className="financial-showcase-stat-label">{item.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
