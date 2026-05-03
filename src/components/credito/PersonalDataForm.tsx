import { TextField } from "@/components/credito/FormFields";
import type { CreditPfPayload } from "@/lib/credit/types";

type PersonalDataFormProps = {
  data: CreditPfPayload;
  errors: Record<string, string>;
  onChange: <K extends keyof CreditPfPayload>(
    field: K,
    value: CreditPfPayload[K]
  ) => void;
};

export function PersonalDataForm({
  data,
  errors,
  onChange,
}: PersonalDataFormProps) {
  return (
    <div className="credpagos-form-grid">
      <TextField
        label="Nome e sobrenome"
        name="fullName"
        value={data.fullName}
        error={errors["pfData.fullName"]}
        onChange={(event) => onChange("fullName", event.target.value)}
      />

      <TextField
        label="CPF"
        name="cpf"
        value={data.cpf}
        error={errors["pfData.cpf"]}
        onChange={(event) => onChange("cpf", event.target.value)}
      />

      <TextField
        label="Data de nascimento"
        name="birthDate"
        value={data.birthDate}
        type="date"
        error={errors["pfData.birthDate"]}
        onChange={(event) => onChange("birthDate", event.target.value)}
      />
    </div>
  );
}
