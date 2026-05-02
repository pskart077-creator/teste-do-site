import PageHero from "@/components/page-hero/PageHero";

export default function ProductHero() {
  return (
    <PageHero
      title="Tokenização e proteção de dados"
      description="Conheça a solução de tokenização e proteção de dados da Credpagos e veja como nossa tecnologia ajuda a proteger informações sensíveis com mais segurança e confiabilidade."
      breadcrumbs={[
        { label: "Início", href: "/" },
        { label: "Produtos", href: "/produtos" },
        { label: "Tokenização e proteção de dados" },
      ]}
    />
  );
}