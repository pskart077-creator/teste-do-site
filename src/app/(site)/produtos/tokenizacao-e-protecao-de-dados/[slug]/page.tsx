import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { buildSegmentServiceMetadata } from "@/lib/seo";
import { getServiceBySlug, SERVICES } from "@/lib/services";

export async function generateMetadata(
  props: PageProps<"/solucoes/para-negocios-recorrentes/[slug]">,
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
    `/solucoes/para-negocios-recorrentes/${service.slug}`,
    {
      segmentTitle: "Capital de Giro",
      segmentKeywords: [
        "capital de giro",
        "credito empresarial",
        "fluxo de caixa",
      ],
    },
  );
}

export function generateStaticParams() {
  return SERVICES.map((service) => ({
    slug: service.slug,
  }));
}

export default async function RecurringBusinessDetailsPage(
  props: PageProps<"/solucoes/para-negocios-recorrentes/[slug]">,
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
