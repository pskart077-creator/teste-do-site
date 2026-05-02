import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import Service from "@/components/produtos/pagamentos-recorrentes/ProductSplit";
import ServiceCard from "@/components/produtos/pagamentos-recorrentes/ProductCard";
import ServicesHero from "@/components/produtos/pagamentos-recorrentes/ProductHero";
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
