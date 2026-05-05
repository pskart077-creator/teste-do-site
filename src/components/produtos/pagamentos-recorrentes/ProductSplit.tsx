import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ProductSplitRecurringPayments() {
  return (
    <FeatureSplitSection
      title="Capital de giro para manter sua operação com previsibilidade"
      description="A Credpagos apoia empresas com crédito para reforço de caixa e continuidade operacional. A liberação ocorre mediante aprovação e análise de crédito, com condições conforme perfil."
      buttonLabel="Simular Crédito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/pagamentos-recorrentes.jpg"
      imageAlt="Capital de giro da Credpagos"
    />
  );
}
