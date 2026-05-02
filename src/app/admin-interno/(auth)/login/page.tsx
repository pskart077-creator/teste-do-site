import Image from "next/image";
import { redirect } from "next/navigation";
import { InternalLoginForm } from "@/components/admin-interno/login-form";
import { getInternalAuthFromServer } from "@/lib/admin-interno/auth";

export default async function InternalAdminLoginPage() {
  const session = await getInternalAuthFromServer();
  if (session) {
    redirect("/admin-interno");
  }

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-media" aria-hidden="true">
        <Image
          src="/assets/img/home/img-03.jpg"
          alt=""
          fill
          priority
          className="admin-auth-media-image"
          sizes="(max-width: 1100px) 100vw, 58vw"
        />
        <div className="admin-auth-media-shade" />
        <span className="admin-auth-media-hex admin-auth-media-hex--one" />
        <span className="admin-auth-media-hex admin-auth-media-hex--two" />
        <span className="admin-auth-media-hex admin-auth-media-hex--three" />
      </section>
      <section className="admin-auth-panel">
        <InternalLoginForm />
      </section>
    </main>
  );
}
