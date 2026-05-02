import PageHero from "@/components/page-hero/PageHero";

export default function ProductHero() {
  return (
    <PageHero
      title="Credito para MEI"
      description="Emprestimo para microempreendedores que precisam investir no negocio, organizar o caixa e manter a operacao."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Produtos", href: "/produtos" },
        { label: "Credito para MEI" },
      ]}
    />
  );
}
