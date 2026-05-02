import { NEWS_STATUS_LABEL } from "@/lib/news/constants";

type NewsStatusBadgeProps = {
  status: keyof typeof NEWS_STATUS_LABEL;
  className?: string;
};

export default function NewsStatusBadge({ status, className }: NewsStatusBadgeProps) {
  return (
    <span className={["credpago-news-admin-status", `is-${status}`, className].filter(Boolean).join(" ")}>
      {NEWS_STATUS_LABEL[status]}
    </span>
  );
}
