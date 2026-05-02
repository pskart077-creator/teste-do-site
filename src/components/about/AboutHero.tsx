import PageHero from "@/components/page-hero/PageHero";

export default function AboutHero() {
  return (
    <PageHero
      title="Sobre Nós"
      description="Conheça a Credpagos e nossa forma de facilitar o acesso ao crédito para MEI, PJ e PF com clareza, segurança e atendimento próximo."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Sobre Nós" },
      ]}
    />
  );
}
