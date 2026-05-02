import PageHero from "@/components/page-hero/PageHero";

export default function TermsOfServiceHero() {
  return (
    <PageHero
      title="Termos de Serviço"
      description="Consulte os Termos de Serviço da Credpagos e entenda as condições, regras e diretrizes que orientam o uso da nossa plataforma e das nossas soluções."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Termos de Serviço" },
      ]}
    />
  );
}