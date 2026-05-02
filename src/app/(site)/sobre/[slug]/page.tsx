import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SlugDetails from "@/components/details/SlugDetails";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import { ABOUT_TOPICS, getAboutTopicBySlug } from "@/lib/about-topics";
import { buildDetailMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return ABOUT_TOPICS.map((topic) => ({
    slug: topic.slug,
  }));
}

export async function generateMetadata(
  props: PageProps<"/sobre/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const topic = getAboutTopicBySlug(slug);

  if (!topic) {
    return {
      title: "Conteúdo não encontrado",
      description: "O conteúdo solicitado não foi encontrado.",
    };
  }

  return buildDetailMetadata(topic, `/sobre/${topic.slug}`);
}

export default async function AboutSlugPage(props: PageProps<"/sobre/[slug]">) {
  const { slug } = await props.params;
  const topic = getAboutTopicBySlug(slug);

  if (!topic) {
    notFound();
  }

  return (
    <>
      <SlugDetails
        detail={topic}
        backHref="/sobre"
        backLabel="Voltar para sobre"
        eyebrow="DETALHES INSTITUCIONAIS"
      />
      <SiteFooter />
    </>
  );
}
