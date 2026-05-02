import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import Service from "@/components/produtos/split-de-pagamentos/ProductSplit";
import ServiceCard from "@/components/produtos/split-de-pagamentos/ProductCard";
import ServicesHero from "@/components/produtos/split-de-pagamentos/ProductHero";
import Contact from "@/components/contato/Contact";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(STATIC_PAGE_SEO.solucoesParaPF);

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
