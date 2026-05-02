import { INTERNAL_PASSWORD_POLICY } from "@/lib/admin-interno/constants";

export function validateStrongPassword(password: string) {
  const issues: string[] = [];

  if (password.length < INTERNAL_PASSWORD_POLICY.minLength) {
    issues.push(`Senha precisa ter pelo menos ${INTERNAL_PASSWORD_POLICY.minLength} caracteres.`);
  }

  if (INTERNAL_PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    issues.push("Senha precisa ter pelo menos uma letra maiúscula.");
  }

  if (INTERNAL_PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    issues.push("Senha precisa ter pelo menos uma letra minúscula.");
  }

  if (INTERNAL_PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password)) {
    issues.push("Senha precisa ter pelo menos um número.");
  }

  if (INTERNAL_PASSWORD_POLICY.requireSymbol && !/[^A-Za-z0-9]/.test(password)) {
    issues.push("Senha precisa ter pelo menos um símbolo.");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}