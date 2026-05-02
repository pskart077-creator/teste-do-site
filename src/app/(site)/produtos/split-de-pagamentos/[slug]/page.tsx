import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { buildSegmentServiceMetadata } from "@/lib/seo";
import { getServiceBySlug, SERVICES } from "@/lib/services";

export async function generateMetadata(
  props: PageProps<"/solucoes/para-marketplaces/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Servico nao encontrado",
      description: "O conteudo solicitado nao foi encontrado.",
    };
  }

  return buildSegmentServiceMetadata(service, `/solucoes/para-marketplaces/${service.slug}`, {
    segmentTitle: "Credito para PF",
    segmentKeywords: [
      "credito para pf",
      "emprestimo pessoal",
      "analise de credito",
    ],
  });
}

export function generateStaticParams() {
  return SERVICES.map((service) => ({
    slug: service.slug,
  }));
}

export default async function PFDetailsPage(
  props: PageProps<"/solucoes/para-marketplaces/[slug]">,
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
