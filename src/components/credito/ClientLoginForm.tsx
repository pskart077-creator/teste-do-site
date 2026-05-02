"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ApiResponse = {
  success: boolean;
  error?: {
    message?: string;
  };
};

export function ClientLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/cliente/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || !payload.success) {
        setMessage(
          payload.error?.message ?? "Não foi possível realizar a autenticação."
        );
        return;
      }

      router.push("/cliente/dashboard");
      router.refresh();
    } catch {
      setMessage("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      className="credpagos-form-grid credpagos-form-grid--one"
      onSubmit={handleSubmit}
    >
      <label className="credpagos-form-group">
        <span className="credpagos-form-label">E-mail</span>
        <input
          className="credpagos-form-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="credpagos-form-group">
        <span className="credpagos-form-label">Senha</span>
        <input
          className="credpagos-form-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {message ? (
        <p className="credpagos-alert credpagos-alert--error">{message}</p>
      ) : null}

      <button
        type="submit"
        className="credpagos-credito-button credpagos-credito-button--primary"
        disabled={isLoading}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}