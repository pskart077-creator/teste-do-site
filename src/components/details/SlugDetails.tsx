import Link from "next/link";
import type { SlugPageDetail } from "@/types";

type SlugDetailsProps = {
  detail: SlugPageDetail;
  backHref: string;
  backLabel: string;
  eyebrow: string;
};

export default function SlugDetails({
  detail,
  backHref,
  backLabel,
  eyebrow,
}: SlugDetailsProps) {
  return (
    <section className="service-details-page section-anchor">
      <div className="service-details-shell">
        <Link href={backHref} className="service-details-back-link">
          {backLabel}
        </Link>

        <header className="service-details-header">
          <p className="service-details-eyebrow">{eyebrow}</p>
          <h1 className="service-details-title">{detail.title}</h1>
          <p className="service-details-description">{detail.description}</p>
        </header>

        <div className="service-details-content">
          <h2>Destaques</h2>
          <ul>
            {detail.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </div>

        <div className="service-details-actions">
          <Link href="/contato" className="site-contact-btn">
            Falar com especialista
          </Link>
        </div>
      </div>
    </section>
  );
}
