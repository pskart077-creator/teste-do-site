import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/news/admin/AdminLoginForm";
import { getAuthSessionFromServer } from "@/lib/news/auth";

export const metadata = {
  title: "Admin Login | News",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage() {
  const session = await getAuthSessionFromServer();
  if (session) {
    redirect("/admin/news");
  }

  return (
    <main className="credpago-news-admin-login">
      <AdminLoginForm />
    </main>
  );
}
