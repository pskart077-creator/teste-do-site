import FeatureSplitSection from "@/components/service-split/FeatureSplitSection";

export default function ServiceSplitEcommerce() {
  return (
    <FeatureSplitSection
      title="Credito para MEI com processo claro e seguro"
      description="A Credpagos facilita o acesso ao emprestimo para microempreendedores com atendimento proximo e analise de credito responsavel. A aprovacao depende de avaliacao e as condicoes variam conforme perfil."
      buttonLabel="Simular Credito"
      buttonHref="/simular-credito"
      imageSrc="/assets/img/produtos/e-commerce.jpg"
      imageAlt="Credito para MEI na Credpagos"
    />
  );
}
