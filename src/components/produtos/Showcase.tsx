"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const showcaseTabs = [
  {
    id: "credito",
    label: "Credito",
    title: "Credito para MEI, PJ e PF",
    description:
      "A Credpagos facilita o acesso ao emprestimo com analise simples e atendimento proximo para cada perfil.",
    image: "/assets/img/home/img-03.jpg",
    points: [
      "Solucoes para pessoa fisica, microempreendedores e empresas",
      "Condicoes conforme avaliacao de perfil",
      "Processo com menos burocracia e mais transparencia",
    ],
  },
  {
    id: "analise",
    label: "Analise",
    title: "Analise responsavel",
    description:
      "Avaliamos cada solicitacao com clareza para apresentar valor, prazo e taxa de forma objetiva.",
    image: "/assets/img/home/img-05.png",
    points: [
      "Aprovacao mediante avaliacao",
      "Condicoes alinhadas ao momento financeiro",
      "Suporte para decisao com seguranca",
    ],
  },
  {
    id: "consultoria",
    label: "Consultoria",
    title: "Atendimento com orientacao",
    description:
      "Nosso time acompanha cada etapa para ajudar na escolha da melhor solucao de credito.",
    image:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80",
    points: [
      "Atendimento humanizado",
      "Mais clareza sobre condicoes e documentacao",
      "Jornada segura do inicio ao fim",
    ],
  },
];

const showcaseStats = [
  { value: "09", label: "solucoes no portfolio" },
  { value: "MEI/PJ/PF", label: "perfis atendidos" },
  { value: "24/7", label: "canais de atendimento" },
  { value: "+", label: "seguranca e transparencia" },
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
              Simular Credito
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
