import PageHero from "@/components/page-hero/PageHero";

export default function ProductHero() {
  return (
    <PageHero
      title="Credito para PJ"
      description="Capital para empresas que precisam manter operacao, reforcar caixa e sustentar crescimento com responsabilidade."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Produtos", href: "/produtos" },
        { label: "Credito para PJ" },
      ]}
    />
  );
}
