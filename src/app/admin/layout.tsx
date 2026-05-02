import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/news/news-admin.css";

export const metadata: Metadata = {
  title: "Admin News | Credpagos",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true,
    },
  },
  referrer: "no-referrer",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="credpago-news-admin-root">{children}</div>;
}
