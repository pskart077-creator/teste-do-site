import type { NavItem } from "@/types";

export const HOME_MAIN_CLASS_NAME = "site-main site-main-home";

export const MOBILE_MENU_BREAKPOINT = 920;

export const HEADER_SCROLL_THRESHOLD = 10;
export const HEADER_SCROLL_DELTA = 4;

export const SITE_NAV_ITEMS: NavItem[] = [
  { label: "Início", href: "/" },
  {
    label: "Soluções",
    href: "/solucoes",
    dropdown: {
      leadCards: [
        {
          title: "Crédito para MEI",
          description:
            "Empréstimo para microempreendedores que precisam investir no negócio, comprar estoque, pagar fornecedores ou organizar o caixa.",
          href: "/solucoes/mei",
        },
        {
          title: "Crédito para PJ",
          description:
            "Capital para empresas que precisam reforçar o fluxo de caixa, manter a operação, expandir ou aproveitar novas oportunidades.",
          href: "/solucoes/pj",
        },
      ],
      quickLinks: [
        {
          label: "Crédito para PF",
          description:
            "Empréstimo pessoal para quem precisa organizar a vida financeira.",
          href: "/solucoes/pf",
        },
      ],
    },
  },
  { label: "Como Funciona", href: "/#como-funciona" },
  { label: "Quem Somos", href: "/sobre" },
  { label: "Dúvidas Frequentes", href: "/duvidas-frequentes" },
  { label: "Contato", href: "/contato" },
];
