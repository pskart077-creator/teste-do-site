import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="not-found-page">
      <div className="not-found-card">
        <p className="not-found-code">404</p>

        <h1 className="not-found-title">Página não encontrada</h1>

        <p className="not-found-description">
          A página que você tentou acessar não existe ou foi movida. Você pode
          voltar para a home ou falar com nosso time.
        </p>

        <div className="not-found-actions">
          <Link href="/" className="site-contact-btn">
            Ir para início
          </Link>

          <Link href="/contato" className="not-found-secondary">
            Fale conosco
          </Link>
        </div>
      </div>
    </section>
  );
}
