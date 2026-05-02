import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { buildSegmentServiceMetadata } from "@/lib/seo";
import { getServiceBySlug, SERVICES } from "@/lib/services";

export async function generateMetadata(
  props: PageProps<"/solucoes/para-empresa/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Servico nao encontrado",
      description: "O conteudo solicitado nao foi encontrado.",
    };
  }

  return buildSegmentServiceMetadata(
    service,
    `/solucoes/para-empresa/${service.slug}`,
    {
      segmentTitle: "Para Empresas",
      segmentKeywords: [
        "para empresas",
        "pessoa juridica",
        "solucoes para empresas",
      ],
    },
  );
}

export function generateStaticParams() {
  return SERVICES.map((service) => ({
    slug: service.slug,
  }));
}

export default async function ProductDetailsPage(
  props: PageProps<"/solucoes/para-empresa/[slug]">,
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
