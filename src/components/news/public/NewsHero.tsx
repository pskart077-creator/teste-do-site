import PageHero from "@/components/page-hero/PageHero";

export default function NewsHero() {
  return (
    <PageHero
      title="News"
      description="Acompanhe as novidades da Credpagos, com conteúdos sobre tecnologia, mercado, inovação e soluções para pessoas e empresas."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "News" },
      ]}
    />
  );
}