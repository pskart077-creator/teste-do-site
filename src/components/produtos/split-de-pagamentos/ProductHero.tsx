import PageHero from "@/components/page-hero/PageHero";

export default function ProductHero() {
  return (
    <PageHero
      title="Credito para PJ"
      description="Solucoes de emprestimo para empresas que buscam reforco financeiro com analise responsavel e condicoes transparentes."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Produtos", href: "/produtos" },
        { label: "Credito para PJ" },
      ]}
    />
  );
}
