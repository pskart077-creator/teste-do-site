import type { Metadata } from "next";
import About from "@/components/about/About";
import Contact from "@/components/contato/Contact";
import Hero from "@/components/hero/Hero";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import NewsList from "@/components/news/NewsList";
import ServiceCard from "@/components/solucoes/ServiceCard";
import Process from "@/components/process/Process";
import Showcase from "@/components/showcase/Showcase";
import Solutions from "@/components/solutions/Solutions";
import { HOME_SEO, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(HOME_SEO);

export default function HomePage() {
  return (
    <>
      <Hero />
      <Showcase />
      <About />
      <ServiceCard />
      <Solutions />
      <Process />
      <NewsList limit={3} />
      <Contact />
      <SiteFooter />
    </>
  );
}
