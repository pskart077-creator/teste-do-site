import PageHero from "@/components/page-hero/PageHero";

export default function ProductHero() {
  return (
    <PageHero
      title="Emprestimo pessoal"
      description="Credito para pessoa fisica com analise simples para organizar a vida financeira e resolver necessidades do dia a dia."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Produtos", href: "/produtos" },
        { label: "Emprestimo pessoal" },
      ]}
    />
  );
}
