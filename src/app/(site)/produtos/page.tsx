import type { Metadata } from "next";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import ProductsHero from "@/components/produtos/ProductHero";
import ProductCard  from "@/components/produtos/ProductCard";
import Contact from "@/components/contato/Contact";
import Showcase from "@/components/produtos/Showcase";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(STATIC_PAGE_SEO.soluções);

export default function ServicesPage() {
  return (
    <>
      <ProductsHero />
      <Showcase />
      <ProductCard />
      <Contact />
      <SiteFooter />
    </>
  );
}
