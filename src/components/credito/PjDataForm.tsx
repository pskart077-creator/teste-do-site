import { TextField } from "@/components/credito/FormFields";
import type { CreditPjPayload } from "@/lib/credit/types";

type PjDataFormProps = {
  data: CreditPjPayload;
  errors: Record<string, string>;
  onChange: <K extends keyof CreditPjPayload>(field: K, value: CreditPjPayload[K]) => void;
};

export function PjDataForm({ data, errors, onChange }: PjDataFormProps) {
  return (
    <div className="credpagos-form-grid">
      <TextField
        label="CNPJ"
        name="cnpj"
        value={data.cnpj}
        error={errors["pjData.cnpj"]}
        onChange={(event) => onChange("cnpj", event.target.value)}
      />
      <TextField
        label="Razão social"
        name="legalName"
        value={data.legalName}
        error={errors["pjData.legalName"]}
        onChange={(event) => onChange("legalName", event.target.value)}
      />
      <TextField
        label="Nome fantasia"
        name="tradeName"
        value={data.tradeName}
        onChange={(event) => onChange("tradeName", event.target.value)}
      />
      <TextField
        label="Tipo societário"
        name="companyType"
        value={data.companyType}
        onChange={(event) => onChange("companyType", event.target.value)}
      />
      <TextField
        label="Data de abertura"
        name="openingDate"
        type="date"
        value={data.openingDate}
        onChange={(event) => onChange("openingDate", event.target.value)}
      />
      <TextField
        label="CNAE"
        name="cnae"
        value={data.cnae}
        onChange={(event) => onChange("cnae", event.target.value)}
      />
      <TextField
        label="Segmento"
        name="segment"
        value={data.segment}
        error={errors["pjData.segment"]}
        onChange={(event) => onChange("segment", event.target.value)}
      />
      <TextField
        label="Faturamento mensal"
        name="monthlyRevenue"
        type="number"
        value={data.monthlyRevenue}
        error={errors["pjData.monthlyRevenue"]}
        onChange={(event) => onChange("monthlyRevenue", Number(event.target.value))}
      />
      <TextField
        label="Faturamento anual"
        name="yearlyRevenue"
        type="number"
        value={data.yearlyRevenue}
        onChange={(event) => onChange("yearlyRevenue", Number(event.target.value))}
      />
      <TextField
        label="Número de funcionários"
        name="employeesCount"
        type="number"
        value={data.employeesCount}
        onChange={(event) => onChange("employeesCount", Number(event.target.value))}
      />
    </div>
  );
}
