import type { Metadata } from "next";
import Contact from "@/components/contato/Contact";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import ServiceCard from "@/components/solucoes/pf/ServiceCard";
import ServicesHero from "@/components/solucoes/pf/PjHero";
import Service from "@/components/solucoes/pf/ServiceSplitPj";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(
  STATIC_PAGE_SEO.solucoesParaVoce,
);

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
