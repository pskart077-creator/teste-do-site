"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function InternalLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialError = useMemo(() => {
    return searchParams.get("error") === "forbidden"
      ? "Você não possui permissão para acessar esta área."
      : null;
  }, [searchParams]);

  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) return;

    setError(null);
    setIsPending(true);

    const form = new FormData(event.currentTarget);

    const payload = {
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      rememberMe,
    };

    try {
      const response = await fetch("/admin-interno/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        setError(result?.error?.message ?? "Falha ao autenticar.");
        return;
      }

      router.replace("/admin-interno");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="admin-auth-card" onSubmit={handleSubmit} noValidate>
      <div className="admin-auth-brand">
        <Image
          src="/assets/img/logo/logo.svg"
          alt="Credpagos"
          width={198}
          height={72}
          priority
          className="admin-auth-brand-logo"
        />
      </div>

      <p className="admin-auth-subtitle">
        Acesso restrito a usuários autorizados.
      </p>

      <label className="admin-auth-label" htmlFor="email">
        E-mail
      </label>
      <div className="admin-auth-input-wrap">
        <Mail className="admin-auth-input-icon" size={18} aria-hidden="true" />
        <input
          className="admin-auth-input"
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          required
          maxLength={254}
          placeholder="admin@empresa.com.br"
          spellCheck={false}
          disabled={isPending}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "admin-auth-error" : undefined}
        />
      </div>

      <label className="admin-auth-label" htmlFor="password">
        Senha
      </label>
      <div className="admin-auth-input-wrap">
        <LockKeyhole
          className="admin-auth-input-icon"
          size={18}
          aria-hidden="true"
        />
        <input
          className="admin-auth-input"
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          minLength={12}
          maxLength={256}
          placeholder="Digite sua senha"
          disabled={isPending}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "admin-auth-error" : undefined}
        />
        <button
          type="button"
          className="admin-auth-visibility"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={showPassword}
          disabled={isPending}
        >
          {showPassword ? (
            <EyeOff size={17} aria-hidden="true" />
          ) : (
            <Eye size={17} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="admin-auth-row">
        <label className="admin-auth-remember" htmlFor="rememberMe">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            disabled={isPending}
          />
          <span>Lembrar-me</span>
        </label>

        <a className="admin-auth-help" href="mailto:suporte@credpagos.com.br">
          Perdeu sua senha?
        </a>
      </div>

      {error ? (
        <p id="admin-auth-error" className="admin-auth-error" aria-live="polite">
          {error}
        </p>
      ) : null}

      <button type="submit" className="admin-auth-submit" disabled={isPending}>
        {isPending ? "Acessando..." : "Acessar"}
      </button>
    </form>
  );
}