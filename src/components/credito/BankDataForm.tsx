import {
  BoolField,
  SelectField,
  TextField,
} from "@/components/credito/FormFields";
import { SHARED_WIZARD_OPTIONS } from "@/components/credito/FormFields";
import type { CreditBankPayload } from "@/lib/credit/types";

type BankDataFormProps = {
  data: CreditBankPayload;
  errors: Record<string, string>;
  onChange: <K extends keyof CreditBankPayload>(
    field: K,
    value: CreditBankPayload[K]
  ) => void;
};

const COMMON_BANK_OPTIONS = [
  { value: "banco_do_brasil", label: "Banco do Brasil" },
  { value: "caixa_economica", label: "Caixa Econômica Federal" },
  { value: "itau", label: "Itaú" },
  { value: "bradesco", label: "Bradesco" },
  { value: "santander", label: "Santander" },
  { value: "nubank", label: "Nubank" },
  { value: "inter", label: "Banco Inter" },
  { value: "c6_bank", label: "C6 Bank" },
  { value: "btg_pactual", label: "BTG Pactual" },
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "pagbank", label: "PagBank" },
  { value: "stone", label: "Stone" },
  { value: "sicredi", label: "Sicredi" },
  { value: "sicoob", label: "Sicoob" },
  { value: "banrisul", label: "Banrisul" },
  { value: "outro", label: "Outro banco" },
];

const BANK_VALUES = COMMON_BANK_OPTIONS.map((bank) => bank.value);

export function BankDataForm({ data, errors, onChange }: BankDataFormProps) {
  const selectedBankValue = BANK_VALUES.includes(data.bank)
    ? data.bank
    : data.bank
      ? "outro"
      : "";

  const isOtherBank = selectedBankValue === "outro";

  return (
    <div className="credpagos-form-section">
      <div className="credpagos-form-grid">
        <SelectField
          label="Banco"
          name="bank"
          value={selectedBankValue}
          options={COMMON_BANK_OPTIONS}
          error={errors["bank.bank"]}
          onChange={(event) => {
            const value = event.target.value;

            if (value === "outro") {
              onChange("bank", "" as CreditBankPayload["bank"]);
              return;
            }

            onChange("bank", value as CreditBankPayload["bank"]);
          }}
        />

        {isOtherBank && (
          <TextField
            label="Informe o banco"
            name="bankOther"
            value={BANK_VALUES.includes(data.bank) ? "" : data.bank}
            error={errors["bank.bank"]}
            onChange={(event) =>
              onChange("bank", event.target.value as CreditBankPayload["bank"])
            }
          />
        )}

        <TextField
          label="Agência"
          name="agency"
          value={data.agency}
          error={errors["bank.agency"]}
          onChange={(event) => onChange("agency", event.target.value)}
        />

        <TextField
          label="Conta"
          name="account"
          value={data.account}
          error={errors["bank.account"]}
          onChange={(event) => onChange("account", event.target.value)}
        />

        <TextField
          label="Dígito"
          name="accountDigit"
          value={data.accountDigit}
          error={errors["bank.accountDigit"]}
          onChange={(event) => onChange("accountDigit", event.target.value)}
        />

        <SelectField
          label="Tipo de conta"
          name="accountType"
          value={data.accountType}
          options={SHARED_WIZARD_OPTIONS.accountTypes}
          error={errors["bank.accountType"]}
          onChange={(event) =>
            onChange(
              "accountType",
              event.target.value as CreditBankPayload["accountType"]
            )
          }
        />

        <TextField
          label="Nome do titular"
          name="holderName"
          value={data.holderName}
          error={errors["bank.holderName"]}
          onChange={(event) => onChange("holderName", event.target.value)}
        />

        <TextField
          label="Documento do titular"
          name="holderDocument"
          value={data.holderDocument}
          error={errors["bank.holderDocument"]}
          onChange={(event) => onChange("holderDocument", event.target.value)}
        />

        <TextField
          label="Chave de recebimento"
          name="pixKey"
          value={data.pixKey}
          error={errors["bank.pixKey"]}
          onChange={(event) => onChange("pixKey", event.target.value)}
        />
      </div>

      <div className="credpagos-form-card">
        <div className="credpagos-form-checkboxes">
          <BoolField
            label="Confirmo que a conta pertence ao solicitante"
            checked={Boolean(data.ownershipConfirmed)}
            onChange={(event) =>
              onChange("ownershipConfirmed", event.target.checked)
            }
          />
        </div>

        {errors["bank.ownershipConfirmed"] && (
          <span className="credpagos-form-error">
            {errors["bank.ownershipConfirmed"]}
          </span>
        )}
      </div>
    </div>
  );
}