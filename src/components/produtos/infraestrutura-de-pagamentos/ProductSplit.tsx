import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ServiceSplitEcommerce() {
  return (
    <FeatureSplitSection
      title="Crédito para MEI com processo claro e seguro"
      description="A Credpagos facilita o acesso ao empréstimo para microempreendedores com atendimento próximo e análise de crédito responsável. A aprovação depende de avaliação e as condições variam conforme perfil."
      buttonLabel="Simular Crédito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/e-commerce.jpg"
      imageAlt="Crédito para MEI na Credpagos"
    />
  );
}
