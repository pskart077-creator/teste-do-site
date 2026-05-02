import {
  Clock3,
  ShieldCheck,
  MessageCircle,
  FileCheck2,
  BadgeCheck,
  Handshake,
} from "lucide-react";

const productItems = [
  {
    icon: Clock3,
    title: "Análise ágil",
    description:
      "Solicite crédito com uma jornada simples e retorno sujeito à análise de crédito.",
  },
  {
    icon: ShieldCheck,
    title: "Processo seguro",
    description:
      "Atendimento com segurança e transparência em todas as etapas da solicitação.",
  },
  {
    icon: MessageCircle,
    title: "Atendimento próximo",
    description:
      "Acompanhamento humano para entender seu momento e orientar a melhor solução.",
  },
  {
    icon: FileCheck2,
    title: "Menos burocracia",
    description:
      "Fluxo objetivo para reduzir fricções e facilitar o acesso ao empréstimo.",
  },
  {
    icon: BadgeCheck,
    title: "Condições transparentes",
    description:
      "Valores, prazos e taxas apresentados com clareza conforme avaliação do perfil.",
  },
  {
    icon: Handshake,
    title: "Crédito com orientação",
    description:
      "Consultoria para escolher a alternativa mais adequada para MEI, PJ ou PF.",
  },
];

export default function Products() {
  return (
    <section id="produtos" className="about-section section-anchor">
      <div className="about-section-header">
        <h2 className="about-section-title">
          Diferenciais Credpagos
          <br />
          para quem busca crédito
        </h2>

        <p className="about-section-subtitle">
          A Credpagos conecta pessoas físicas, microempreendedores e empresas a
          soluções de empréstimo com clareza, segurança e atendimento próximo.
        </p>
      </div>

      <div className="about-cards-grid">
        {productItems.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title} className="about-card">
              <div className="about-card-icon">
                <Icon size={34} strokeWidth={2.1} />
              </div>

              <div className="about-card-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
