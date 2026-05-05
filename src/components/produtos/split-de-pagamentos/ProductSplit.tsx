import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ProductSplitPayments() {
  return (
    <FeatureSplitSection
      title="Crédito para PJ com orientação especializada"
      description="A Credpagos conecta empresas a soluções de empréstimo com análise responsável, atendimento próximo e condições transparentes. A aprovação depende de avaliação de perfil."
      buttonLabel="Simular Crédito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/split-de-pagamentos.jpg"
      imageAlt="Crédito para PJ na Credpagos"
    />
  );
}
