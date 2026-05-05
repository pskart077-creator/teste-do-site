import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ProductSplitCheckout() {
  return (
    <FeatureSplitSection
      title="Crédito para PJ com orientação e transparência"
      description="A Credpagos conecta empresas a soluções de crédito com processo seguro e análise simples. A aprovação é sujeita a avaliação, e condições podem variar conforme o perfil do solicitante."
      buttonLabel="Simular Crédito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/checkout-inteligente.jpg"
      imageAlt="Crédito para PJ na Credpagos"
    />
  );
}
