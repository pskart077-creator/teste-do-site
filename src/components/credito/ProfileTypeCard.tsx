"use client";

import Link from "next/link";
import { ArrowRight, Building2, Briefcase, UserRound } from "lucide-react";
import type { ProfileTypeCardItem } from "@/components/credito/types";

type ProfileTypeCardProps = {
  item: ProfileTypeCardItem;
};

function ProfileIcon({ mode }: { mode: ProfileTypeCardItem["mode"] }) {
  if (mode === "MEI") {
    return <Briefcase size={20} />;
  }

  if (mode === "PJ") {
    return <Building2 size={20} />;
  }

  return <UserRound size={20} />;
}

export function ProfileTypeCard({ item }: ProfileTypeCardProps) {
  return (
    <article className="credpagos-credito-card credpagos-credito-card--profile">
      <span className="credpagos-credito-icon" aria-hidden="true">
        <ProfileIcon mode={item.mode} />
      </span>

      <h3 className="credpagos-credito-card-title">{item.title}</h3>

      <p className="credpagos-credito-card-description">{item.description}</p>

      <Link
        href={item.href}
        className="credpagos-credito-button credpagos-credito-button--primary"
      >
        Começar a simulação <ArrowRight size={16} />
      </Link>
    </article>
  );
}