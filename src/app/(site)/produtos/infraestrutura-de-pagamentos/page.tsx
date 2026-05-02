import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import Service from "@/components/produtos/infraestrutura-de-pagamentos/ProductSplit";
import ServiceCard from "@/components/produtos/infraestrutura-de-pagamentos/ProductCard";
import ServicesHero from "@/components/produtos/infraestrutura-de-pagamentos/ProductHero";
import Contact from "@/components/contato/Contact";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(STATIC_PAGE_SEO.solucoesParaEmpresas);

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
