import { BoolField, TextField } from "@/components/credito/FormFields";
import type { CreditPartnerPayload } from "@/lib/credit/types";

type PartnersStepProps = {
  partners: CreditPartnerPayload[];
  errors: Record<string, string>;
  onAddPartner: () => void;
  onRemovePartner: (index: number) => void;
  onChangePartner: <K extends keyof CreditPartnerPayload>(
    index: number,
    field: K,
    value: CreditPartnerPayload[K],
  ) => void;
};

export function PartnersStep({
  partners,
  errors,
  onAddPartner,
  onRemovePartner,
  onChangePartner,
}: PartnersStepProps) {
  return (
    <div className="credpagos-form-grid credpagos-form-grid--one">
      {partners.map((partner, index) => (
        <div className="credpagos-status-card" key={`partner-${index}`}>
          <div className="credpagos-form-grid">
            <TextField
              label={`Sócio ${index + 1} - Nome`}
              name={`partner-name-${index}`}
              value={partner.name}
              error={errors[`partners.${index}.name`]}
              onChange={(event) => onChangePartner(index, "name", event.target.value)}
            />
            <TextField
              label="CPF"
              name={`partner-cpf-${index}`}
              value={partner.cpf}
              error={errors[`partners.${index}.cpf`]}
              onChange={(event) => onChangePartner(index, "cpf", event.target.value)}
            />
            <TextField
              label="Participação (%)"
              name={`partner-ownership-${index}`}
              type="number"
              value={partner.ownershipPercent}
              onChange={(event) =>
                onChangePartner(index, "ownershipPercent", Number(event.target.value))
              }
            />
            <TextField
              label="E-mail"
              name={`partner-email-${index}`}
              type="email"
              value={partner.email}
              onChange={(event) => onChangePartner(index, "email", event.target.value)}
            />
            <TextField
              label="WhatsApp"
              name={`partner-whatsapp-${index}`}
              value={partner.whatsapp}
              onChange={(event) => onChangePartner(index, "whatsapp", event.target.value)}
            />
            <div className="credpagos-form-checkboxes">
              <BoolField
                label="É administrador?"
                checked={partner.isAdministrator}
                onChange={(event) =>
                  onChangePartner(index, "isAdministrator", event.target.checked)
                }
              />
            </div>
          </div>
          {partners.length > 1 ? (
            <button
              type="button"
              className="credpagos-credito-button credpagos-credito-button--ghost"
              onClick={() => onRemovePartner(index)}
            >
              Remover sócio
            </button>
          ) : null}
        </div>
      ))}

      <button
        type="button"
        className="credpagos-credito-button credpagos-credito-button--ghost"
        onClick={onAddPartner}
      >
        Adicionar sócio
      </button>
    </div>
  );
}
