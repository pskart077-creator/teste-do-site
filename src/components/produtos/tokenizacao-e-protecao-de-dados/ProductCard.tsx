import {
  LockKeyhole,
  Shield,
  Database,
  Fingerprint,
  ScanLine,
  FileLock2,
} from "lucide-react";
import ServiceCard from "@/components/service-card-s-link/ServiceCard";

const productsData = [
  {
    title: "Protecao de dados sensiveis",
    description:
      "Camadas adicionais de seguranca para preservar informacoes importantes do cliente.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: LockKeyhole,
  },
  {
    title: "Mais confianca no processo",
    description:
      "Jornada de solicitacao de credito com foco em protecao e privacidade.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Shield,
  },
  {
    title: "Menor exposicao de dados",
    description:
      "Boas praticas para reduzir risco no tratamento de informacoes financeiras.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Database,
  },
  {
    title: "Seguranca para o cliente",
    description:
      "Experiencia mais segura em todas as etapas de contato e avaliacao.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Fingerprint,
  },
  {
    title: "Monitoramento continuo",
    description:
      "Padrao elevado de protecao para reforcar seguranca e confiabilidade.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: ScanLine,
  },
  {
    title: "Controle e governanca",
    description:
      "Mais visibilidade sobre regras e protocolos de seguranca da operacao.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: FileLock2,
  },
];

export default function Products() {
  return (
    <section className="solutions-grid-section">
      <div className="solutions-grid-container">
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
