import PageHero from "@/components/page-hero/PageHero";

export default function ProductHero() {
  return (
    <PageHero
      title="Análise de crédito avançada"
      description="Conheça a solução da Credpagos para analisar perfil, entender possibilidades e apoiar decisões de crédito com mais segurança."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Produtos", href: "/produtos" },
        { label: "Análise de crédito avançada" },
      ]}
    />
  );
}
