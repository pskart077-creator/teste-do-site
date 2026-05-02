import PageHero from "@/components/page-hero/PageHero";

export default function ProductHero() {
  return (
    <PageHero
      title="Capital de giro"
      description="Solucao de credito para manter a operacao da empresa com previsibilidade, seguranca e menos burocracia."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Produtos", href: "/produtos" },
        { label: "Capital de giro" },
      ]}
    />
  );
}
