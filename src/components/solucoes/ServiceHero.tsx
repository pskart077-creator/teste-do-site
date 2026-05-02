import PageHero from "@/components/page-hero/PageHero";

export default function ServicesHero() {
  return (
    <PageHero
      title="Nossas Soluções"
      description="Conheça as soluções de crédito da Credpagos para MEI, PJ e PF com análise simples, atendimento humanizado e condições transparentes."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Soluções" },
      ]}
    />
  );
}
