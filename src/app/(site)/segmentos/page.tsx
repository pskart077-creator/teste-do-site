import type { Metadata } from "next";
import Contact from "@/components/contato/Contact";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import SegmentsSection from "@/components/solucoes/services";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(STATIC_PAGE_SEO.segmentos);

export default function SegmentsPage() {
  return (
    <>
      <SegmentsSection />
      <Contact />
      <SiteFooter />
    </>
  );
}
