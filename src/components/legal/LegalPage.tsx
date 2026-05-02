export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

export default function LegalPage({
  eyebrow,
  title,
  lastUpdated,
  intro,
  sections,
}: LegalPageProps) {
  return (
    <section className="legal-page section-anchor">
      <div className="legal-page-shell">
        <header className="legal-page-header">
          <p className="legal-page-eyebrow">{eyebrow}</p>
          <h1 className="legal-page-title">{title}</h1>
          <p className="legal-page-updated">última atualização: {lastUpdated}</p>
          <p className="legal-page-intro">{intro}</p>
        </header>

        <div className="legal-page-content">
          {sections.map((section) => (
            <article key={section.title} className="legal-page-card">
              <h2>{section.title}</h2>

              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}

              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
