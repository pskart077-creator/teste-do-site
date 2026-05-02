import type { Metadata } from "next";
import Contact from "@/components/contato/Contact";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import ServiceCard from "@/components/solucoes/pj/ServiceCard";
import PjHero from "@/components/solucoes/pj/PjHero";
import ServiceSplitPj from "@/components/solucoes/pj/ServiceSplitPj";
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
