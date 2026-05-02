import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ServiceSplitPessoaFisica() {
  return (
    <FeatureSplitSection
      title="Crédito para Pessoa Física com orientação personalizada"
      description="A Credpagos apoia pessoas que precisam de crédito para organizar a vida financeira, quitar dívidas, realizar planos ou lidar com imprevistos. Nosso atendimento é próximo, transparente e focado em entender sua necessidade antes de apresentar as melhores condições disponíveis. A aprovação é sujeita à análise de crédito, e valores, prazos e taxas podem variar conforme o perfil."
      buttonLabel="Simular crédito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/pf.png"
      imageAlt="Consultoria de crédito da Credpagos para Pessoa Física"
    />
  );
}