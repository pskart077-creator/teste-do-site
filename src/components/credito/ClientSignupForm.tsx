"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ApiResponse = {
  success: boolean;
  error?: {
    message?: string;
  };
};

export function ClientSignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/cliente/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || !payload.success) {
        setMessage(
          payload.error?.message ?? "Não foi possível concluir o cadastro."
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
        <span className="credpagos-form-label">Nome completo</span>
        <input
          className="credpagos-form-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

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
        <span className="credpagos-form-label">WhatsApp</span>
        <input
          className="credpagos-form-input"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
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
        {isLoading ? "Enviando..." : "Criar conta"}
      </button>
    </form>
  );
}