import PageHero from "@/components/page-hero/PageHero";

export default function ProductsHero() {
  return (
    <PageHero
      title="Nossos Produtos"
      description="Conheça os produtos da Credpagos e veja como facilitamos o acesso ao crédito para MEI, PJ e PF com análise responsável, atendimento próximo e condições transparentes."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Produtos" },
      ]}
    />
  );
}
