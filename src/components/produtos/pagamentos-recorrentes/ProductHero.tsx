import PageHero from "@/components/page-hero/PageHero";

export default function ProductHero() {
  return (
    <PageHero
      title="Capital de giro"
      description="Solução de crédito para manter a operação da empresa com previsibilidade, segurança e menos burocracia."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Produtos", href: "/produtos" },
        { label: "Capital de giro" },
      ]}
    />
  );
}
