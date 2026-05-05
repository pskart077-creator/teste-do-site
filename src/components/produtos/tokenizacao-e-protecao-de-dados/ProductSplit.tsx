import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ProductSplitTokenization() {
  return (
    <FeatureSplitSection
      title="Processo seguro para proteger dados em toda a jornada"
      description="A Credpagos reforça a proteção de dados com práticas de segurança para tornar a solicitação de crédito mais confiável e transparente."
      buttonLabel="Simular Crédito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/tokenizacao-e-protecao-de-dados.jpg"
      imageAlt="Proteção de dados na Credpagos"
    />
  );
}
