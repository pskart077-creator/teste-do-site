import PageHero from "@/components/page-hero/PageHero";

export default function ServicesHero() {
  return (
    <PageHero
      title="Soluções para PJ"
      description="Crédito com atendimento próximo para empresas que precisam fortalecer o caixa, investir na operação, ampliar estrutura ou aproveitar novas oportunidades."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Soluções", href: "/solucoes" },
        { label: "Soluções para PJ" },
      ]}
    />
  );
}