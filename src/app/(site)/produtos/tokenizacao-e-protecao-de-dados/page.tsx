import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import Service from "@/components/produtos/tokenizacao-e-protecao-de-dados/ProductSplit";
import ServiceCard from "@/components/produtos/tokenizacao-e-protecao-de-dados/ProductCard";
import ServicesHero from "@/components/produtos/tokenizacao-e-protecao-de-dados/ProductHero";
import Contact from "@/components/contato/Contact";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(STATIC_PAGE_SEO.solucoesParaNegociosRecorrentes);

export default function PjPage() {
  return (
    <>
      <ServicesHero />
      <Service />
      <ServiceCard />
      <Contact />
      <SiteFooter />
    </>
  );
}
