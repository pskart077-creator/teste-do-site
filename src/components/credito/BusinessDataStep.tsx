import { BoolField, TextField } from "@/components/credito/FormFields";
import type { CreditPjPayload } from "@/lib/credit/types";

type BusinessDataStepProps = {
  data: CreditPjPayload;
  errors: Record<string, string>;
  onChange: <K extends keyof CreditPjPayload>(
    field: K,
    value: CreditPjPayload[K]
  ) => void;
};

export function BusinessDataStep({
  data,
  errors,
  onChange,
}: BusinessDataStepProps) {
  return (
    <div className="credpagos-form-grid">
      <TextField
        label="Receita mensal média"
        name="monthlyRevenue"
        type="number"
        value={data.monthlyRevenue}
        error={errors["pjData.monthlyRevenue"]}
        onChange={(event) =>
          onChange("monthlyRevenue", Number(event.target.value))
        }
      />

      <TextField
        label="Despesas mensais médias"
        name="expensesMonthly"
        type="number"
        value={data.expensesMonthly}
        error={errors["pjData.expensesMonthly"]}
        onChange={(event) =>
          onChange("expensesMonthly", Number(event.target.value))
        }
      />

      <TextField
        label="Lucro médio"
        name="averageProfit"
        type="number"
        value={data.averageProfit}
        error={errors["pjData.averageProfit"]}
        onChange={(event) =>
          onChange("averageProfit", Number(event.target.value))
        }
      />

      <TextField
        label="Valor aproximado das parcelas atuais"
        name="currentInstallmentsAmount"
        type="number"
        value={data.currentInstallmentsAmount}
        onChange={(event) =>
          onChange("currentInstallmentsAmount", Number(event.target.value))
        }
      />

      <div className="credpagos-form-checkboxes">
        <BoolField
          label="Possui empréstimos ativos?"
          checked={Boolean(data.hasActiveLoans)}
          onChange={(event) =>
            onChange("hasActiveLoans", event.target.checked)
          }
        />

        <BoolField
          label="Possui restrição empresarial?"
          checked={Boolean(data.hasBusinessRestrictions)}
          onChange={(event) =>
            onChange("hasBusinessRestrictions", event.target.checked)
          }
        />

        <BoolField
          label="Possui restrição em nome dos sócios?"
          checked={Boolean(data.hasPartnerRestrictions)}
          onChange={(event) =>
            onChange("hasPartnerRestrictions", event.target.checked)
          }
        />
      </div>
    </div>
  );
}