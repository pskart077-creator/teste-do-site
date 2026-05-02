import { TextField } from "@/components/credito/FormFields";
import type { CreditMeiPayload } from "@/lib/credit/types";

type MeiResponsibleStepProps = {
  data: CreditMeiPayload;
  errors: Record<string, string>;
  onChange: <K extends keyof CreditMeiPayload>(field: K, value: CreditMeiPayload[K]) => void;
};

export function MeiResponsibleStep({ data, errors, onChange }: MeiResponsibleStepProps) {
  return (
    <div className="credpagos-form-grid">
      <TextField
        label="Nome completo"
        name="responsibleName"
        value={data.responsibleName}
        error={errors["meiData.responsibleName"]}
        onChange={(event) => onChange("responsibleName", event.target.value)}
      />
      <TextField
        label="CPF"
        name="responsibleCpf"
        value={data.responsibleCpf}
        error={errors["meiData.responsibleCpf"]}
        onChange={(event) => onChange("responsibleCpf", event.target.value)}
      />
      <TextField
        label="Data de nascimento"
        name="responsibleBirthDate"
        type="date"
        value={data.responsibleBirthDate}
        onChange={(event) => onChange("responsibleBirthDate", event.target.value)}
      />
      <TextField
        label="E-mail"
        name="responsibleEmail"
        type="email"
        value={data.responsibleEmail}
        error={errors["meiData.responsibleEmail"]}
        onChange={(event) => onChange("responsibleEmail", event.target.value)}
      />
      <TextField
        label="WhatsApp"
        name="responsibleWhatsapp"
        value={data.responsibleWhatsapp}
        error={errors["meiData.responsibleWhatsapp"]}
        onChange={(event) => onChange("responsibleWhatsapp", event.target.value)}
      />
    </div>
  );
}
