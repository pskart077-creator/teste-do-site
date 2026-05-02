import type { Metadata } from "next";
import About from "@/components/about/About";
import ContactSection from "@/components/contato/ContactSection";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import Process from "@/components/process/Process";
import SecurityHero from "@/components/seguranca/SecurityHero";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(STATIC_PAGE_SEO.segurança);

export default function SecurityPage() {
  return (
    <>
      <SecurityHero />
      <About />
      <Process />
      <ContactSection />
      <SiteFooter />
    </>
  );
}
