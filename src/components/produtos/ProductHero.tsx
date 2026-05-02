import PageHero from "@/components/page-hero/PageHero";

export default function ProductsHero() {
  return (
    <PageHero
      title="Nossos Produtos"
      description="Conheca os produtos da Credpagos e veja como facilitamos o acesso ao credito para MEI, PJ e PF com analise responsavel, atendimento proximo e condicoes transparentes."
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Produtos" },
      ]}
    />
  );
}
