import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type ServiceCardProps = {
  number: string;
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
  icon: LucideIcon;
};

export default function ServiceCard({
  number,
  title,
  description,
  href = "#",
  linkLabel = "Saiba Mais",
  icon: Icon,
}: ServiceCardProps) {
  return (
    <article className="service-card">
      <span className="service-card__number">{number}</span>

      <div className="service-card__icon">
        <Icon className="service-card__icon-svg" strokeWidth={1.8} />
      </div>

      <h3 className="service-card__title">{title}</h3>

      <p className="service-card__description">{description}</p>

    </article>
  );
}