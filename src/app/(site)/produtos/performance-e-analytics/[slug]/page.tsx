import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { buildSegmentServiceMetadata } from "@/lib/seo";
import { getServiceBySlug, SERVICES } from "@/lib/services";

export async function generateMetadata(
  props: PageProps<"/solucoes/para-plataformas-digitais/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Serviço não encontrado",
      description: "O conteúdo solicitado não foi encontrado.",
    };
  }

  return buildSegmentServiceMetadata(
    service,
    `/solucoes/para-plataformas-digitais/${service.slug}`,
    {
      segmentTitle: "An?lise de Cr?dito",
      segmentKeywords: [
        "para plataformas digitais",
        "integracao financeira",
        "automacao para plataforma digital",
      ],
    },
  );
}

export function generateStaticParams() {
  return SERVICES.map((service) => ({
    slug: service.slug,
  }));
}

export default async function PlatformDetailsPage(
  props: PageProps<"/solucoes/para-plataformas-digitais/[slug]">,
) {
  const { slug } = await props.params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  return (
    <>
      <SiteFooter />
    </>
  );
}
