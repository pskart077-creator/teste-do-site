import { TextField } from "@/components/credito/FormFields";
import type { CreditMeiPayload } from "@/lib/credit/types";

type MeiBusinessDataStepProps = {
  data: CreditMeiPayload;
  errors: Record<string, string>;
  onChange: <K extends keyof CreditMeiPayload>(field: K, value: CreditMeiPayload[K]) => void;
};

export function MeiBusinessDataStep({ data, errors, onChange }: MeiBusinessDataStepProps) {
  return (
    <div className="credpagos-form-grid">
      <TextField
        label="CNPJ"
        name="cnpj"
        value={data.cnpj}
        error={errors["meiData.cnpj"]}
        onChange={(event) => onChange("cnpj", event.target.value)}
      />
      <TextField
        label="Razão social"
        name="legalName"
        value={data.legalName}
        error={errors["meiData.legalName"]}
        onChange={(event) => onChange("legalName", event.target.value)}
      />
      <TextField
        label="Nome fantasia"
        name="tradeName"
        value={data.tradeName}
        onChange={(event) => onChange("tradeName", event.target.value)}
      />
      <TextField
        label="Data de abertura"
        name="openingDate"
        type="date"
        value={data.openingDate}
        error={errors["meiData.openingDate"]}
        onChange={(event) => onChange("openingDate", event.target.value)}
      />
      <TextField
        label="CNAE principal"
        name="cnae"
        value={data.cnae}
        onChange={(event) => onChange("cnae", event.target.value)}
      />
      <TextField
        label="Atividade principal"
        name="activity"
        value={data.activity}
        onChange={(event) => onChange("activity", event.target.value)}
      />
      <TextField
        label="Segmento"
        name="segment"
        value={data.segment}
        onChange={(event) => onChange("segment", event.target.value)}
      />
      <TextField
        label="Faturamento mensal médio"
        name="monthlyRevenue"
        type="number"
        value={data.monthlyRevenue}
        error={errors["meiData.monthlyRevenue"]}
        onChange={(event) => onChange("monthlyRevenue", Number(event.target.value))}
      />
      <TextField
        label="Faturamento anual estimado"
        name="yearlyRevenue"
        type="number"
        value={data.yearlyRevenue}
        onChange={(event) => onChange("yearlyRevenue", Number(event.target.value))}
      />
    </div>
  );
}
