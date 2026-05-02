import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Globe } from "lucide-react";

export default function Hero() {
  return (
    <section id="início" className="credpago-hero section-anchor">
      <div className="credpago-hero__bg" aria-hidden="true">
        <div className="credpago-hero__overlay" />
      </div>

      <div className="credpago-hero__container">
        <div className="credpago-hero__inner">
          <div className="credpago-hero__content">
            <h1 className="credpago-hero__title">
              Crédito rápido para MEI,
              <br />
              PJ e PF com
              <br />
              análise simples.
            </h1>

            <p className="credpago-hero__description">
              A Credpagos facilita o acesso ao empréstimo para pessoas físicas,
              microempreendedores e empresas. Tenha uma experiência mais simples,
              segura e transparente para solicitar crédito quando precisar.
            </p>

            <div className="credpago-hero__actions">
              <Link href="/simular-credito" className="credpago-hero__button">
                Simular Crédito
              </Link>
            </div>
          </div>

          <div className="credpago-hero__visual">
            <div className="credpago-hero__grid">
              <article className="credpago-hero__card credpago-hero__card--main">
                <span className="credpago-hero__brand-badge">Credpagos</span>

                <div className="credpago-hero__media-slot credpago-hero__media-slot--main">
                  <Image
                    src="/assets/img/hero/credpago-main.png"
                    alt="Painel da Credpagos em notebook"
                    fill
                    priority
                    className="credpago-hero__main-image"
                  />
                </div>

                <div className="credpago-hero__floating">
                  <div className="credpago-hero__floating-avatar">
                    <Image
                      src="/assets/img/hero/credpago-avatar.png"
                      alt="Avatar de cliente"
                      fill
                      className="credpago-hero__floating-avatar-image"
                    />
                  </div>

                  <div className="credpago-hero__floating-copy">
                    <strong>Análise em andamento</strong>
                    <span>Hoje</span>
                  </div>

                  <div className="credpago-hero__floating-value">
                    <strong>R$ 20 mil</strong>
                    <span>Solicitação em avaliação</span>
                  </div>
                </div>
              </article>

              <div className="credpago-hero__stack">
                <article className="credpago-hero__card credpago-hero__card--top">
                  <div className="credpago-hero__media-slot credpago-hero__media-slot--top">
                    <Image
                      src="/assets/img/hero/credpago-top.jpg"
                      alt="Equipe da Credpagos em atendimento"
                      fill
                      className="credpago-hero__top-image"
                    />
                  </div>

                  <div className="credpago-hero__top-pill">
                    <div className="credpago-hero__top-pill-icon">
                      <Globe size={15} />
                    </div>

                    <div className="credpago-hero__top-pill-copy">
                      <strong>Crédito com transparência</strong>
                      <span>Condições conforme o perfil</span>
                    </div>
                  </div>
                </article>

                <article className="credpago-hero__card credpago-hero__card--phone">
                  <div className="credpago-hero__phone-image-wrap">
                    <Image
                      src="/assets/img/hero/credpago-phone.png"
                      alt="Aplicativo da Credpagos no celular"
                      fill
                      priority
                      className="credpago-hero__phone-image"
                    />
                  </div>
                </article>
              </div>

              <article className="credpago-hero__card credpago-hero__card--banner">
                <div className="credpago-hero__banner-copy">
                  <p>Soluções de crédito com segurança e menos burocracia</p>
                </div>

                <div className="credpago-hero__banner-arrow" aria-hidden="true">
                  <ArrowUpRight size={28} />
                </div>

                <div className="credpago-hero__banner-mark" aria-hidden="true" />
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
