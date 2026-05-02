import { Check } from "lucide-react";
import Image from "next/image";

const aboutItemsLeft = [
  "Crédito para MEI",
  "Crédito para PJ",
  "Crédito para PF",
];

const aboutItemsRight = [
  "Análise responsável",
  "Menos burocracia",
  "Atendimento humanizado",
];

export default function AboutSection() {
  return (
    <section className="about-crypto-section">
      <div className="about-crypto-container">
        <div className="about-crypto-grid">
          <div className="about-crypto-content">
            <span className="about-crypto-pill">Sobre nós</span>

            <h2 className="about-crypto-title">
              Sobre Nós
              <br />
              Credpagos
            </h2>

            <p className="about-crypto-description">
              A Credpagos nasceu para simplificar o acesso ao crédito. Atuamos
              conectando pessoas físicas, microempreendedores e empresas a
              soluções de empréstimo mais claras, seguras e alinhadas ao seu
              momento financeiro. Nosso compromisso é oferecer atendimento
              próximo, análise responsável e uma jornada menos burocrática.
            </p>

            <div className="about-crypto-lists">
              <ul className="about-crypto-list">
                {aboutItemsLeft.map((item) => (
                  <li key={item}>
                    <span className="about-crypto-list__icon">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <ul className="about-crypto-list">
                {aboutItemsRight.map((item) => (
                  <li key={item}>
                    <span className="about-crypto-list__icon">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="about-crypto-visual">
            <div className="about-crypto-card">
              <Image
                src="/assets/img/about/logo.svg"
                alt="Credpagos crédito para MEI, PJ e PF"
                fill
                className="about-crypto-card__image"
              />

              <span className="about-crypto-square about-crypto-square--one" />
              <span className="about-crypto-square about-crypto-square--two" />
              <span className="about-crypto-square about-crypto-square--three" />
              <span className="about-crypto-square about-crypto-square--four" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
