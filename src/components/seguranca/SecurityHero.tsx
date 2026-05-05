import PageHero from "@/components/page-hero/PageHero";

export default function SecurityHero() {
  return (
    <PageHero
      title="Segurança"
      description="Veja como a Credpagos estrutura processos para manter operações financeiras com mais confiança e previsibilidade."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Segurança" },
      ]}
    />
  );
}
