import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ServiceSplitPJ() {
  return (
    <FeatureSplitSection
      title="Crédito para PJ com orientação estratégica"
      description="A Credpagos apoia empresas que precisam de crédito para fortalecer o caixa, investir na operação, ampliar estrutura ou aproveitar novas oportunidades. Nosso atendimento é próximo, transparente e focado em entender a realidade do negócio antes de apresentar as melhores condições disponíveis. A aprovação é sujeita à análise de crédito, e valores, prazos e taxas podem variar conforme o perfil da empresa."
      buttonLabel="Simular crédito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/pj.png"
      imageAlt="Consultoria de crédito da Credpagos para PJ"
    />
  );
}