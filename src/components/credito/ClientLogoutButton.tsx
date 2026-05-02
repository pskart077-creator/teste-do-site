"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClientLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <button
      type="button"
      className="credpagos-credito-button credpagos-credito-button--ghost"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        await fetch("/api/cliente/logout", { method: "POST" });
        router.push("/cliente/login");
        router.refresh();
      }}
    >
      {isLoading ? "Saindo..." : "Sair"}
    </button>
  );
}