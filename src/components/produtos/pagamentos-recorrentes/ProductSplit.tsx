import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ProductSplitRecurringPayments() {
  return (
    <FeatureSplitSection
      title="Capital de giro para manter sua operacao com previsibilidade"
      description="A Credpagos apoia empresas com credito para reforco de caixa e continuidade operacional. A liberacao ocorre mediante aprovacao e analise de credito, com condicoes conforme perfil."
      buttonLabel="Simular Credito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/pagamentos-recorrentes.jpg"
      imageAlt="Capital de giro da Credpagos"
    />
  );
}
