import type { Metadata } from "next";
import ContactHero from "@/components/contato/ContactHero";
import ContactSection from "@/components/contato/ContactSection";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(STATIC_PAGE_SEO.contato);

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactSection />
      <SiteFooter />
    </>
  );
}
