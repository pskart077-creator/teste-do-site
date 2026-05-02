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

const maritalStatusOptions = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "uniao_estavel", label: "União estável" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "separado", label: "Separado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
];

export function PersonalDataForm({
  data,
  errors,
  onChange,
}: PersonalDataFormProps) {
  return (
    <div className="credpagos-form-grid">
      <TextField
        label="Nome completo"
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

      <TextField
        label="Nome da mãe"
        name="motherName"
        value={data.motherName}
        error={errors["pfData.motherName"]}
        onChange={(event) => onChange("motherName", event.target.value)}
      />

      <div className="credpagos-form-group">
        <label className="credpagos-form-label" htmlFor="maritalStatus">
          Estado civil
        </label>

        <select
          id="maritalStatus"
          name="maritalStatus"
          className={`credpagos-form-select ${
            errors["pfData.maritalStatus"] ? "credpagos-form-select-error" : ""
          }`}
          value={data.maritalStatus}
          onChange={(event) =>
            onChange(
              "maritalStatus",
              event.target.value as CreditPfPayload["maritalStatus"]
            )
          }
        >
          <option value="">Selecione</option>

          {maritalStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {errors["pfData.maritalStatus"] && (
          <span className="credpagos-form-error">
            {errors["pfData.maritalStatus"]}
          </span>
        )}
      </div>

      <TextField
        label="Nacionalidade"
        name="nationality"
        value={data.nationality}
        error={errors["pfData.nationality"]}
        onChange={(event) => onChange("nationality", event.target.value)}
      />

      <TextField
        label="E-mail"
        name="email"
        value={data.email}
        type="email"
        error={errors["pfData.email"]}
        onChange={(event) => onChange("email", event.target.value)}
      />

      <TextField
        label="WhatsApp"
        name="whatsapp"
        value={data.whatsapp}
        error={errors["pfData.whatsapp"]}
        onChange={(event) => onChange("whatsapp", event.target.value)}
      />
    </div>
  );
}