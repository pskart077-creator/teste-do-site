import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ProductSplitPaymentLink() {
  return (
    <FeatureSplitSection
      title="Emprestimo pessoal com atendimento proximo"
      description="Na Credpagos, voce encontra uma jornada simples para solicitar credito pessoal com orientacao e transparencia. A aprovacao esta sujeita a analise de credito e as condicoes podem variar conforme perfil."
      buttonLabel="Simular Credito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/link-de-pagamento.jpg"
      imageAlt="Emprestimo pessoal da Credpagos"
    />
  );
}
