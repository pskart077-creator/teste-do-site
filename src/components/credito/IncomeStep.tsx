import { TextField } from "@/components/credito/FormFields";
import type { CreditPfPayload } from "@/lib/credit/types";

type IncomeStepProps = {
  data: CreditPfPayload;
  errors: Record<string, string>;
  onChange: <K extends keyof CreditPfPayload>(
    field: K,
    value: CreditPfPayload[K]
  ) => void;
};

function formatCurrencyBRL(value?: number) {
  if (!value) return "";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function parseCurrencyBRL(value: string) {
  const sanitized = value.replace(/[^\d,.]/g, "").trim();

  if (!sanitized) return 0;

  if (sanitized.includes(",") || sanitized.includes(".")) {
    const normalized = sanitized.replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function IncomeStep({ data, errors, onChange }: IncomeStepProps) {
  return (
    <div className="credpagos-form-grid credpagos-form-grid-single">
      <TextField
        label="Renda mensal"
        name="monthlyIncome"
        value={formatCurrencyBRL(data.monthlyIncome)}
        type="text"
        error={errors["pfData.monthlyIncome"]}
        onChange={(event) =>
          onChange(
            "monthlyIncome",
            parseCurrencyBRL(
              event.target.value
            ) as CreditPfPayload["monthlyIncome"]
          )
        }
      />
    </div>
  );
}
