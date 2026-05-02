import {
  CreditCard,
  ShoppingBag,
  Link2,
  RefreshCcw,
  Split,
  ShieldCheck,
  LockKeyhole,
  BarChart3,
  Plug,
} from "lucide-react";
import ServiceCard from "@/components/service-card/ServiceCard";

const productsData = [
  {
    title: "Credito para MEI",
    description:
      "Emprestimo para microempreendedores investirem no negocio e organizarem o caixa.",
    href: "/produtos/infraestrutura-de-pagamentos",
    linkLabel: "Saiba mais",
    icon: CreditCard,
  },
  {
    title: "Credito para PJ",
    description:
      "Capital para reforcar fluxo de caixa, manter operacao e aproveitar oportunidades.",
    href: "/produtos/checkout-inteligente",
    linkLabel: "Saiba mais",
    icon: ShoppingBag,
  },
  {
    title: "Credito para PF",
    description:
      "Emprestimo pessoal para organizar contas, resolver imprevistos e realizar planos.",
    href: "/produtos/link-de-pagamento",
    linkLabel: "Saiba mais",
    icon: Link2,
  },
  {
    title: "Capital de giro",
    description:
      "Solucao para empresas manterem o negocio em movimento com mais previsibilidade.",
    href: "/produtos/pagamentos-recorrentes",
    linkLabel: "Saiba mais",
    icon: RefreshCcw,
  },
  {
    title: "Emprestimo pessoal",
    description:
      "Alternativa para quem precisa de apoio financeiro com analise simples e transparente.",
    href: "/produtos/split-de-pagamentos",
    linkLabel: "Saiba mais",
    icon: Split,
  },
  {
    title: "Analise de credito",
    description:
      "Processo responsavel para avaliar perfil e apresentar condicoes adequadas.",
    href: "/simular-credito",
    linkLabel: "Saiba mais",
    icon: ShieldCheck,
  },
  {
    title: "Processo seguro",
    description:
      "Protecao de dados e boas praticas para uma jornada de solicitacao confiavel.",
    href: "/produtos/tokenizacao-e-protecao-de-dados",
    linkLabel: "Saiba mais",
    icon: LockKeyhole,
  },
  {
    title: "Condicoes transparentes",
    description:
      "Clareza sobre valores, prazos e taxas para apoiar decisoes com seguranca.",
    href: "/produtos/performance-e-analytics",
    linkLabel: "Saiba mais",
    icon: BarChart3,
  },
  {
    title: "Consultoria de credito",
    description:
      "Atendimento proximo para orientar a melhor solucao para MEI, PJ e PF.",
    href: "/produtos/conexoes-e-integracoes",
    linkLabel: "Saiba mais",
    icon: Plug,
  },
];

export default function Products() {
  return (
    <section className="solutions-grid-section">
      <div className="solutions-grid-container">
        <div className="solutions-grid-intro">
          <span className="solutions-grid-eyebrow">Produtos</span>
          <h2 className="solutions-grid-title">
            Solucoes de credito para cada momento financeiro
          </h2>
          <p className="solutions-grid-description">
            A Credpagos apoia MEI, PJ e PF com emprestimos, capital de giro,
            analise de credito e consultoria para uma jornada mais simples e
            transparente.
          </p>
        </div>

        <div className="solutions-grid">
          {productsData.map((item, index) => (
            <ServiceCard
              key={`${item.title}-${index}`}
              number={String(index + 1).padStart(2, "0")}
              title={item.title}
              description={item.description}
              href={item.href}
              linkLabel={item.linkLabel}
              icon={item.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
