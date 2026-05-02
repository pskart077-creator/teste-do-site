import PageHero from "@/components/page-hero/PageHero";

export default function CookiePolicyHero() {
  return (
    <PageHero
      title="Política de Cookies"
      description="Entenda como a Credpagos utiliza cookies para melhorar a navegação, reforçar a segurança e oferecer uma experiência mais personalizada."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Política de Cookies" },
      ]}
    />
  );
}