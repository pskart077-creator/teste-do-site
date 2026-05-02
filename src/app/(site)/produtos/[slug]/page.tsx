import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SlugDetails from "@/components/details/SlugDetails";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { buildServiceMetadata } from "@/lib/seo";
import { getServiceBySlug, SERVICES } from "@/lib/services";

export async function generateMetadata(
  props: PageProps<"/solucoes/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Serviço não encontrado",
      description: "O conteúdo solicitado não foi encontrado.",
    };
  }

  return buildServiceMetadata(service);
}

export function generateStaticParams() {
  return SERVICES.map((service) => ({
    slug: service.slug,
  }));
}

export default async function ServiceDetailsPage(
  props: PageProps<"/solucoes/[slug]">,
) {
  const { slug } = await props.params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  return (
    <>
      <SlugDetails
        detail={service}
        backHref="/solucoes"
        backLabel="Voltar para serviços"
        eyebrow="DETALHES DO SERVICO"
      />
      <SiteFooter />
    </>
  );
}
