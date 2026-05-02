import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ProductSplitCheckout() {
  return (
    <FeatureSplitSection
      title="Credito para PJ com orientacao e transparencia"
      description="A Credpagos conecta empresas a solucoes de credito com processo seguro e analise simples. A aprovacao e sujeita a avaliacao, e condicoes podem variar conforme o perfil do solicitante."
      buttonLabel="Simular Credito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/checkout-inteligente.jpg"
      imageAlt="Credito para PJ na Credpagos"
    />
  );
}
