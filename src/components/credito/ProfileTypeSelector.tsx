import type { ProfileTypeCardItem } from "@/components/credito/types";
import { ProfileTypeCard } from "@/components/credito/ProfileTypeCard";

const PROFILE_ITEMS: ProfileTypeCardItem[] = [
  {
    mode: "PF",
    title: "Pessoa Física",
    description:
      "Crédito para você organizar sua vida financeira com mais clareza e acompanhamento.",
    href: "/solicitacao/pf",
  },
  {
    mode: "MEI",
    title: "MEI",
    description:
      "Crédito para microempreendedores que precisam investir, organizar o caixa ou impulsionar o negócio.",
    href: "/solicitacao/mei",
  },
  {
    mode: "PJ",
    title: "Pessoa Jurídica",
    description:
      "Soluções de crédito para empresas que buscam capital para crescer com planejamento.",
    href: "/solicitacao/pj",
  },
];

export function ProfileTypeSelector() {
  return (
    <section className="credpagos-credito-grid credpagos-credito-grid--profiles">
      {PROFILE_ITEMS.map((item) => (
        <ProfileTypeCard key={item.mode} item={item} />
      ))}
    </section>
  );
}
