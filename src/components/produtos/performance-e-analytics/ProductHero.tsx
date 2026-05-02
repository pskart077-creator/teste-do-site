import PageHero from "@/components/page-hero/PageHero";

export default function ProductHero() {
  return (
    <PageHero
      title="Analise de credito avancada"
      description="Conheca a solucao da Credpagos para analisar perfil, entender possibilidades e apoiar decisoes de credito com mais seguranca."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Produtos", href: "/produtos" },
        { label: "Analise de credito avancada" },
      ]}
    />
  );
}
