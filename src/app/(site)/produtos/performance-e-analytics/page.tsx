import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import Service from "@/components/produtos/performance-e-analytics/ProductSplit";
import ServiceCard from "@/components/produtos/performance-e-analytics/ProductCard";
import ServicesHero from "@/components/produtos/performance-e-analytics/ProductHero";
import Contact from "@/components/contato/Contact";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(STATIC_PAGE_SEO.solucoesParaPlataformasDigitais);

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
