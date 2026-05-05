import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ProductSplitPaymentLink() {
  return (
    <FeatureSplitSection
      title="Empréstimo pessoal com atendimento proximo"
      description="Na Credpagos, você encontra uma jornada simples para solicitar crédito pessoal com orientação e transparência. A aprovação está sujeita a análise de crédito e as condições podem variar conforme perfil."
      buttonLabel="Simular Crédito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/link-de-pagamento.jpg"
      imageAlt="Empréstimo pessoal da Credpagos"
    />
  );
}
