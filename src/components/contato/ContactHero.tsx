import PageHero from "@/components/page-hero/PageHero";

export default function ContactHero() {
  return (
    <PageHero
      title="Contato"
      description="Fale com o time da Credpagos para simular crédito e entender as condições conforme o seu perfil."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Contato" },
      ]}
    />
  );
}
