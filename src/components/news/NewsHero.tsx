import PageHero from "@/components/page-hero/PageHero";

export default function NewsHero() {
  return (
    <PageHero
      title="News"
      description="Acompanhe as últimas novidades da Credpagos sobre produto, tecnologia, segurança e mercado."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "News" },
      ]}
    />
  );
}
