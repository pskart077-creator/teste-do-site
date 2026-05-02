import type { Metadata } from "next";
import Contact from "@/components/contato/Contact";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import ServiceCard from "@/components/produtos/checkout-inteligente/ProductCard";
import PjHero from "@/components/produtos/checkout-inteligente/ProductHero";
import ServiceSplitPj from "@/components/produtos/checkout-inteligente/ProductSplit";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(STATIC_PAGE_SEO.solucoesParaEmpresas);

export default function PjPage() {
  return (
    <>
      <PjHero />
      <ServiceSplitPj />
      <ServiceCard />
      <Contact />
      <SiteFooter />
    </>
  );
}
