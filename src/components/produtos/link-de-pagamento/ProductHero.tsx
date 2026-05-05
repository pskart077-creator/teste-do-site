import PageHero from "@/components/page-hero/PageHero";

export default function ProductHero() {
  return (
    <PageHero
      title="Empréstimo pessoal"
      description="Crédito para pessoa física com análise simples para organizar a vida financeira e resolver necessidades do dia a dia."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Produtos", href: "/produtos" },
        { label: "Empréstimo pessoal" },
      ]}
    />
  );
}
