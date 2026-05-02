import PageHero from "@/components/page-hero/PageHero";

export default function ServicesHero() {
  return (
    <PageHero
      title="Soluções para MEI"
      description="Crédito simples, rápido e acessível para MEIs que precisam organizar o caixa, investir no negócio ou aproveitar novas oportunidades."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Soluções", href: "/solucoes" },
        { label: "Soluções para MEI" },
      ]}
    />
  );
}