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
    title: "Proteção de dados sensíveis",
    description:
      "Camadas adicionais de segurança para preservar informações importantes do cliente.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: LockKeyhole,
  },
  {
    title: "Mais confiança no processo",
    description:
      "Jornada de solicitação de crédito com foco em proteção e privacidade.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Shield,
  },
  {
    title: "Menor exposição de dados",
    description:
      "Boas práticas para reduzir risco no tratamento de informações financeiras.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Database,
  },
  {
    title: "Segurança para o cliente",
    description:
      "Experiência mais segura em todas as etapas de contato e avaliação.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Fingerprint,
  },
  {
    title: "Monitoramento contínuo",
    description:
      "Padrão elevado de proteção para reforçar segurança e confiabilidade.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: ScanLine,
  },
  {
    title: "Controle e governança",
    description:
      "Mais visibilidade sobre regras e protocolos de segurança da operação.",
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
