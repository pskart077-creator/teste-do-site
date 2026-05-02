import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ProductSplitPayments() {
  return (
    <FeatureSplitSection
      title="Credito para PJ com orientacao especializada"
      description="A Credpagos conecta empresas a solucoes de emprestimo com analise responsavel, atendimento proximo e condicoes transparentes. A aprovacao depende de avaliacao de perfil."
      buttonLabel="Simular Credito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/split-de-pagamentos.jpg"
      imageAlt="Credito para PJ na Credpagos"
    />
  );
}
