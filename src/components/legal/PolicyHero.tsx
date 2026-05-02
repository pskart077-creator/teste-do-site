import PageHero from "@/components/page-hero/PageHero";

export default function PrivacyPolicyHero() {
  return (
    <PageHero
      title="Política de Privacidade"
      description="Consulte a Política de Privacidade da Credpagos e entenda como coletamos, utilizamos, armazenamos e protegemos os seus dados pessoais em nossa plataforma e em nossas soluções."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Política de Privacidade" },
      ]}
    />
  );
}