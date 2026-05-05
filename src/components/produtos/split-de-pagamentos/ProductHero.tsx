import PageHero from "@/components/page-hero/PageHero";

export default function ProductHero() {
  return (
    <PageHero
      title="Crédito para PJ"
      description="Soluções de empréstimo para empresas que buscam reforço financeiro com análise responsável e condições transparentes."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Produtos", href: "/produtos" },
        { label: "Crédito para PJ" },
      ]}
    />
  );
}
