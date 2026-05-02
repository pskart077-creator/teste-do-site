import Image from "next/image";
import Link from "next/link";

type FeatureSplitSectionProps = {
  title: string;
  description: string;
  buttonLabel?: string;
  buttonHref?: string;
  imageSrc: string;
  imageAlt: string;
  imageLeft?: boolean;
};

export default function FeatureSplitSection({
  title,
  description,
  buttonLabel,
  buttonHref = "#",
  imageSrc,
  imageAlt,
  imageLeft = false,
}: FeatureSplitSectionProps) {
  return (
    <section className="feature-split-section">
      <div className="feature-split-container">
        <div
          className={`feature-split-grid ${
            imageLeft ? "feature-split-grid--image-left" : ""
          }`}
        >
          <div className="feature-split-content">
            <h2 className="feature-split-title">{title}</h2>
            <p className="feature-split-description">{description}</p>

            {buttonLabel ? (
              <div className="feature-split-actions">
                <Link href={buttonHref} className="feature-split-button">
                  {buttonLabel}
                </Link>
              </div>
            ) : null}
          </div>

          <div className="feature-split-visual">
            <div className="feature-split-image-wrap">
              <Image
                src={imageSrc}
                alt={imageAlt}
                className="feature-split-image"
                fill
                sizes="(max-width: 1920px) 100vw, 560px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
