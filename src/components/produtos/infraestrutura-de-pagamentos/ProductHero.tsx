import PageHero from "@/components/page-hero/PageHero";

export default function ProductHero() {
  return (
    <PageHero
      title="Crédito para MEI"
      description="Empréstimo para microempreendedores que precisam investir no negócio, organizar o caixa e manter a operação."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Produtos", href: "/produtos" },
        { label: "Crédito para MEI" },
      ]}
    />
  );
}
