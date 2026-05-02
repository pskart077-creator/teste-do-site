"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const showcaseTabs = [
  {
    id: "about",
    label: "Sobre",
    title: "Crédito com clareza para MEI, PJ e PF",
    description:
      "A Credpagos facilita o acesso ao empréstimo com atendimento próximo, análise responsável e soluções alinhadas ao momento de cada cliente.",
    image: "/assets/img/home/img-03.jpg",
    points: [
      "Atendimento humanizado",
      "Menos burocracia na solicitação",
      "Condições transparentes conforme avaliação",
    ],
  },
  {
    id: "mission",
    label: "Missão",
    title: "Simplificar o acesso ao crédito",
    description:
      "Nossa missão é conectar pessoas físicas, microempreendedores e empresas a soluções de crédito com segurança, transparência e orientação.",
    image: "/assets/img/home/img-05.png",
    points: [
      "Crédito para MEI, PJ e PF",
      "Análise de crédito responsável",
      "Suporte em toda a jornada",
    ],
  },
  {
    id: "vision",
    label: "Visão",
    title: "Mais confiança para quem precisa de crédito",
    description:
      "Queremos tornar a contratação de empréstimos mais acessível, segura e clara, com propostas adequadas ao perfil de cada cliente.",
    image:
      "/assets/img/home/img-07.png",
    points: [
      "Aprovação mediante avaliação",
      "Valores, prazos e taxas conforme perfil",
      "Relacionamento de longo prazo com o cliente",
    ],
  },
];

const showcaseStats = [
  { value: "MEI", label: "soluções para microempreendedores" },
  { value: "PJ", label: "crédito para empresas" },
  { value: "PF", label: "empréstimo pessoal" },
  { value: "100%", label: "atendimento com transparência" },
];

export default function Showcase() {
  const [activeTab, setActiveTab] = useState(showcaseTabs[0].id);

  const activeContent =
    showcaseTabs.find((item) => item.id === activeTab) ?? showcaseTabs[0];

  return (
    <section id="plataforma" className="financial-showcase section-anchor">
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
              aria-label="Abas institucionais da Credpagos"
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
