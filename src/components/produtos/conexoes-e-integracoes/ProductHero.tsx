import PageHero from "@/components/page-hero/PageHero";

export default function ProductHero() {
  return (
    <PageHero
      title="Conexões e integrações"
      description="Conheça a solução de conexões e integrações da Credpagos e veja como nossa tecnologia ajuda a conectar sistemas, fluxos e parceiros com mais agilidade e eficiência."
      breadcrumbs={[
        { label: "Início", href: "/" },
        { label: "Produtos", href: "/produtos" },
        { label: "Conexões e integrações" },
      ]}
    />
  );
}