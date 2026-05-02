import type { Metadata } from "next";
import About from "@/components/about/About";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import AboutSection from "@/components/about/AboutSection";
import Contact from "@/components/contato/Contact";
import Process from "@/components/process/Process";
import AboutHero from "@/components/about/AboutHero";
import Showcase from "@/components/showcase/Showcase";
import { STATIC_PAGE_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(STATIC_PAGE_SEO.sobre);

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutSection />
      <Showcase />
      <About />
      <Process />
      <Contact />
      <SiteFooter />
    </>
  );
}
