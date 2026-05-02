import PageHero from "@/components/page-hero/PageHero";

export default function ServicesHero() {
  return (
    <PageHero
      title="Soluções para Pessoa Física"
      description="Crédito com atendimento próximo para pessoas que precisam organizar a vida financeira, quitar dívidas, realizar planos ou lidar com imprevistos."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Soluções", href: "/solucoes" },
        { label: "Soluções para Pessoa Física" },
      ]}
    />
  );
}