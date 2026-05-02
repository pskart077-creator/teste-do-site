import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import ServicesHero from "@/components/solucoes/ServiceHero";
import ServiceCard from "@/components/solucoes/ServiceCard";
import Contact from "@/components/contato/Contact";
import Solutions from "@/components/solutions/Solutions";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(STATIC_PAGE_SEO.soluções);

export default function ServicesPage() {
  return (
    <>
      <ServicesHero />
      <Solutions />
      <ServiceCard />
      <Contact />
      <SiteFooter />
    </>
  );
}
