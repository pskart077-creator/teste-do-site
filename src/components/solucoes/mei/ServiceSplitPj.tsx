import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ServiceSplitEmpresas() {
  return (
    <FeatureSplitSection
      title="Crédito para MEI com orientação clara do começo ao fim"
      description="A Credpagos apoia MEIs que precisam de crédito para organizar o caixa, investir no negócio ou aproveitar novas oportunidades. Nosso atendimento é próximo, transparente e voltado para entender sua necessidade antes de apresentar as melhores condições disponíveis. A aprovação é sujeita à análise de crédito, e valores, prazos e taxas podem variar conforme o perfil."
      buttonLabel="Simular crédito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/mei.png"
      imageAlt="Consultoria de crédito da Credpagos para MEI"
    />
  );
}