import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminNewsShell from "@/components/news/admin/AdminNewsShell";
import { requireServerAdmin } from "@/lib/news/auth";
import { NEWS_ROLE_LABEL } from "@/lib/news/constants";
import "@/styles/dashboard/dashboard.css";
import "@/styles/news/news-editor.css";

export const metadata: Metadata = {
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

export default async function AdminNewsLayout({ children }: { children: ReactNode }) {
  const session = await requireServerAdmin();

  return (
    <div className="admin-interno-root credpago-news-admin-layout">
      <AdminNewsShell
        user={{
          displayName: session.displayName,
          roleLabel: NEWS_ROLE_LABEL[session.role],
        }}
      >
        {children}
      </AdminNewsShell>
    </div>
  );
}
