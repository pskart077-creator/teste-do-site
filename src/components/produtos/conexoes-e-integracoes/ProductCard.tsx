import {
  Plug,
  Workflow,
  Network,
  Link2,
  Shuffle,
  Zap,
} from "lucide-react";
import ServiceCard from "@/components/service-card-s-link/ServiceCard";

const productsData = [
  {
    title: "Mais conexão entre sistemas",
    description:
      "Integre ferramentas, plataformas e processos com mais fluidez para sustentar uma operação mais conectada.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Plug,
  },
  {
    title: "Fluxos mais integrados",
    description:
      "Organize melhor a comunicação entre etapas da operação com integrações mais eficientes e consistentes.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Workflow,
  },
  {
    title: "Ecossistema mais unificado",
    description:
      "Conecte diferentes pontos da jornada operacional para reduzir barreiras e ganhar mais eficiência.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Network,
  },
  {
    title: "Integração mais simples",
    description:
      "Facilite a conexão com parceiros, sistemas e soluções para acelerar a evolução da operação.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Link2,
  },
  {
    title: "Menos fricção técnica",
    description:
      "Reduza complexidades na comunicação entre ferramentas e torne os processos mais leves e funcionais.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Shuffle,
  },
  {
    title: "Mais agilidade operacional",
    description:
      "Ganhe velocidade para integrar, adaptar fluxos e sustentar o crescimento com mais eficiência.",
    href: "#",
    linkLabel: "Saiba mais",
    icon: Zap,
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