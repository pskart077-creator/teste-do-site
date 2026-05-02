import Link from "next/link";

export default function ContactBanner() {
  return (
    <section className="contact-banner">
      <div className="contact-banner__bg" aria-hidden="true" />

      <div className="contact-banner__container">
        <div className="contact-banner__content">
          <h2 className="contact-banner__title">Fale com a Credpagos</h2>

          <p className="contact-banner__description">
            Descubra como a Credpagos pode apoiar MEI, PJ e PF com soluções de
            crédito mais claras, seguras e adequadas ao seu momento financeiro.
          </p>

          <Link href="/simular-credito" className="contact-banner__button">
            Simular Crédito
          </Link>
        </div>
      </div>
    </section>
  );
}
