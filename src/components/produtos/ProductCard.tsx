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
    title: "Crédito para MEI",
    description:
      "Empréstimo para microempreendedores investirem no negócio e organizarem o caixa.",
    href: "/produtos/infraestrutura-de-pagamentos",
    linkLabel: "Saiba mais",
    icon: CreditCard,
  },
  {
    title: "Crédito para PJ",
    description:
      "Capital para reforçar fluxo de caixa, manter operação e aproveitar oportunidades.",
    href: "/produtos/checkout-inteligente",
    linkLabel: "Saiba mais",
    icon: ShoppingBag,
  },
  {
    title: "Crédito para PF",
    description:
      "Empréstimo pessoal para organizar contas, resolver imprevistos e realizar planos.",
    href: "/produtos/link-de-pagamento",
    linkLabel: "Saiba mais",
    icon: Link2,
  },
  {
    title: "Capital de giro",
    description:
      "Solução para empresas manterem o negócio em movimento com mais previsibilidade.",
    href: "/produtos/pagamentos-recorrentes",
    linkLabel: "Saiba mais",
    icon: RefreshCcw,
  },
  {
    title: "Empréstimo pessoal",
    description:
      "Alternativa para quem precisa de apoio financeiro com análise simples e transparente.",
    href: "/produtos/split-de-pagamentos",
    linkLabel: "Saiba mais",
    icon: Split,
  },
  {
    title: "Análise de crédito",
    description:
      "Processo responsável para avaliar perfil e apresentar condições adequadas.",
    href: "/simular-credito",
    linkLabel: "Saiba mais",
    icon: ShieldCheck,
  },
  {
    title: "Processo seguro",
    description:
      "Proteção de dados e boas práticas para uma jornada de solicitação confiável.",
    href: "/produtos/tokenizacao-e-protecao-de-dados",
    linkLabel: "Saiba mais",
    icon: LockKeyhole,
  },
  {
    title: "Condições transparentes",
    description:
      "Clareza sobre valores, prazos e taxas para apoiar decisões com segurança.",
    href: "/produtos/performance-e-analytics",
    linkLabel: "Saiba mais",
    icon: BarChart3,
  },
  {
    title: "Consultoria de crédito",
    description:
      "Atendimento próximo para orientar a melhor solução para MEI, PJ e PF.",
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
            Soluções de crédito para cada momento financeiro
          </h2>
          <p className="solutions-grid-description">
            A Credpagos apoia MEI, PJ e PF com empréstimos, capital de giro,
            análise de crédito e consultoria para uma jornada mais simples e
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
