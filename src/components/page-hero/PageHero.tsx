import Link from "next/link";

type PageHeroBreadcrumb = {
  label: string;
  href?: string;
};

type PageHeroProps = {
  title: string;
  description: string;
  breadcrumbs: PageHeroBreadcrumb[];
};

export default function PageHero({
  title,
  description,
  breadcrumbs,
}: PageHeroProps) {
  return (
    <section className="page-hero section-anchor">
      <div className="page-hero-shell">
        <nav className="page-hero-breadcrumb" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <span key={`${crumb.label}-${index}`} className="page-hero-crumb">
                {crumb.href && !isLast ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span aria-current={isLast ? "page" : undefined}>
                    {crumb.label}
                  </span>
                )}

                {!isLast ? <span aria-hidden="true">»</span> : null}
              </span>
            );
          })}
        </nav>

        <h1 className="page-hero-title">{title}</h1>
        <p className="page-hero-description">{description}</p>
      </div>
    </section>
  );
}