import {
  BoolField,
  SelectField,
  TextField,
  SHARED_WIZARD_OPTIONS,
} from "@/components/credito/FormFields";
import type { CreditPfPayload } from "@/lib/credit/types";

type IncomeStepProps = {
  data: CreditPfPayload;
  errors: Record<string, string>;
  onChange: <K extends keyof CreditPfPayload>(
    field: K,
    value: CreditPfPayload[K]
  ) => void;
};

const incomeTimeOptions = [
  { value: "menos_6_meses", label: "Menos de 6 meses" },
  { value: "6_12_meses", label: "De 6 a 12 meses" },
  { value: "1_2_anos", label: "De 1 a 2 anos" },
  { value: "2_5_anos", label: "De 2 a 5 anos" },
  { value: "mais_5_anos", label: "Mais de 5 anos" },
];

function formatCurrencyBRL(value?: number) {
  if (!value) return "";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function parseCurrencyBRL(value: string) {
  const onlyNumbers = value.replace(/\D/g, "");

  if (!onlyNumbers) return 0;

  return Number(onlyNumbers) / 100;
}

export function IncomeStep({ data, errors, onChange }: IncomeStepProps) {
  return (
    <div className="credpagos-form-section">
      <div className="credpagos-form-section-header"></div>

      <div className="credpagos-form-grid">
        <TextField
          label="Profissão ou ocupação principal"
          name="profession"
          value={data.profession}
          error={errors["pfData.profession"]}
          onChange={(event) => onChange("profession", event.target.value)}
        />

        <SelectField
          label="Origem principal da renda"
          name="incomeType"
          value={data.incomeType}
          options={SHARED_WIZARD_OPTIONS.incomeTypes}
          error={errors["pfData.incomeType"]}
          onChange={(event) =>
            onChange(
              "incomeType",
              event.target.value as CreditPfPayload["incomeType"]
            )
          }
        />

        <TextField
          label="Renda mensal comprovada"
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

        <SelectField
          label="Há quanto tempo recebe essa renda?"
          name="incomeTime"
          value={data.incomeTime}
          options={incomeTimeOptions}
          error={errors["pfData.incomeTime"]}
          onChange={(event) =>
            onChange(
              "incomeTime",
              event.target.value as CreditPfPayload["incomeTime"]
            )
          }
        />
      </div>

      <div className="credpagos-form-card">
        <div className="credpagos-form-card-header"></div>

        <div className="credpagos-form-checkboxes">
          <BoolField
            label="Possui restrição em seu nome?"
            checked={Boolean(data.hasRestrictions)}
            onChange={(event) =>
              onChange("hasRestrictions", event.target.checked)
            }
          />

          <BoolField
            label="Possui empréstimos ou financiamentos ativos?"
            checked={Boolean(data.hasActiveLoans)}
            onChange={(event) => {
              const checked = event.target.checked;

              onChange("hasActiveLoans", checked);

              if (!checked) {
                onChange(
                  "currentInstallmentsAmount",
                  0 as CreditPfPayload["currentInstallmentsAmount"]
                );
              }
            }}
          />
        </div>

        {data.hasActiveLoans && (
          <div className="credpagos-form-grid credpagos-form-grid-single">
            <TextField
              label="Valor total das parcelas mensais atuais"
              name="currentInstallmentsAmount"
              value={formatCurrencyBRL(data.currentInstallmentsAmount)}
              type="text"
              error={errors["pfData.currentInstallmentsAmount"]}
              onChange={(event) =>
                onChange(
                  "currentInstallmentsAmount",
                  parseCurrencyBRL(
                    event.target.value
                  ) as CreditPfPayload["currentInstallmentsAmount"]
                )
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}