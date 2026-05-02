import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ProductSplitTokenization() {
  return (
    <FeatureSplitSection
      title="Processo seguro para proteger dados em toda a jornada"
      description="A Credpagos reforca a protecao de dados com praticas de seguranca para tornar a solicitacao de credito mais confiavel e transparente."
      buttonLabel="Simular Credito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/tokenizacao-e-protecao-de-dados.jpg"
      imageAlt="Protecao de dados na Credpagos"
    />
  );
}
