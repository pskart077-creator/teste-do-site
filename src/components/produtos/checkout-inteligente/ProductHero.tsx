import PageHero from "@/components/page-hero/PageHero";

export default function ProductHero() {
  return (
    <PageHero
      title="Crédito para PJ"
      description="Capital para empresas que precisam manter operação, reforçar caixa e sustentar crescimento com responsabilidade."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Produtos", href: "/produtos" },
        { label: "Crédito para PJ" },
      ]}
    />
  );
}
