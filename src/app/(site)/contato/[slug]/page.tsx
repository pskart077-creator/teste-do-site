import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SlugDetails from "@/components/details/SlugDetails";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { CONTACT_TOPICS, getContactTopicBySlug } from "@/lib/contact-topics";
import { buildDetailMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return CONTACT_TOPICS.map((topic) => ({
    slug: topic.slug,
  }));
}

export async function generateMetadata(
  props: PageProps<"/contato/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const topic = getContactTopicBySlug(slug);

  if (!topic) {
    return {
      title: "Conteúdo não encontrado",
      description: "O conteúdo solicitado não foi encontrado.",
    };
  }

  return buildDetailMetadata(topic, `/contato/${topic.slug}`);
}

export default async function ContactSlugPage(
  props: PageProps<"/contato/[slug]">,
) {
  const { slug } = await props.params;
  const topic = getContactTopicBySlug(slug);

  if (!topic) {
    notFound();
  }

  return (
    <>
      <SlugDetails
        detail={topic}
        backHref="/contato"
        backLabel="Voltar para contato"
        eyebrow="DETALHES DE CONTATO"
      />
      <SiteFooter />
    </>
  );
}
