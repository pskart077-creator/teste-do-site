"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import Image from "next/image";

const pfItems = [
  "Empréstimo pessoal com análise responsável",
  "Condições conforme perfil e avaliação",
  "Atendimento próximo para orientar a decisão",
];

const pjItems = [
  "Crédito para reforçar fluxo de caixa",
  "Capital de giro para manter a operação",
  "Soluções para expansão com mais previsibilidade",
];

export default function SegmentsSection() {
  return (
    <section className="segments-section">
      <div className="segments-container">
        <div className="segments-grid">
          <div className="segments-visual">
            <Image
              src="/assets/img/home/img-03.jpg"
              alt="Credpagos para pessoa física"
              className="segments-image"
              width={1920}
              height={1080}
            />
          </div>

          <div className="segments-content">
            <h2 className="segments-title">Para Você</h2>

            <p className="segments-description">
              A Credpagos oferece soluções para pessoa física com atendimento
              humanizado, análise responsável e condições transparentes.
            </p>

            <ul className="segments-list">
              {pfItems.map((item) => (
                <li key={item} className="segments-list-item">
                  <span className="segments-list-icon">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link href="/solucoes/credito-para-pf" className="segments-button">
              Ver Mais
            </Link>
          </div>

          <div className="segments-content">
            <h2 className="segments-title">Para Sua Empresa</h2>

            <p className="segments-description">
              A Credpagos apoia empresas com crédito para PJ e capital de giro,
              sempre com análise de crédito e orientação comercial.
            </p>

            <ul className="segments-list">
              {pjItems.map((item) => (
                <li key={item} className="segments-list-item">
                  <span className="segments-list-icon">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link href="/solucoes/credito-para-pj" className="segments-button">
              Ver Mais
            </Link>
          </div>

          <div className="segments-visual">
            <Image
              src="/assets/img/home/img-06.png"
              alt="Credpagos para empresas"
              className="segments-image"
              width={1688}
              height={1080}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
