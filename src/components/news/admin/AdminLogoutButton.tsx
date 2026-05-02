"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type AdminLogoutButtonProps = {
  buttonClassName?: string;
};

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const segments = document.cookie.split(";").map((segment) => segment.trim());
  for (const segment of segments) {
    if (!segment.startsWith(`${name}=`)) {
      continue;
    }
    return decodeURIComponent(segment.slice(name.length + 1));
  }
  return "";
}

export default function AdminLogoutButton({
  buttonClassName = "credpago-news-admin-button is-muted",
}: AdminLogoutButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      setError(null);
      const csrf = readCookie("credpago_admin_csrf");

      const response = await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        setError("Não foi possível encerrar a sessão.");
        return;
      }

      router.push("/admin/login");
      router.refresh();
    });
  };

  return (
    <div>
      <button type="button" className={buttonClassName} onClick={handleLogout}>
        {isPending ? "Saindo..." : "Sair"}
      </button>
      {error ? <p className="credpago-news-admin-error">{error}</p> : null}
    </div>
  );
}
