"use client";

import { useState } from "react";
import { TextField } from "@/components/credito/FormFields";
import type { CreditAddressPayload } from "@/lib/credit/types";

type AddressFormProps = {
  data: CreditAddressPayload;
  errors: Record<string, string>;
  onChange: <K extends keyof CreditAddressPayload>(
    field: K,
    value: CreditAddressPayload[K]
  ) => void;
};

type CepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export function AddressForm({ data, errors, onChange }: AddressFormProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepMessage, setCepMessage] = useState<string | null>(null);

  async function handleLookupCep() {
    const cep = data.zipcode.replace(/\D/g, "");

    if (cep.length !== 8) {
      setCepMessage("Informe um CEP válido com 8 dígitos.");
      return;
    }

    setIsLoadingCep(true);
    setCepMessage(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const payload = (await response.json()) as CepResponse;

      if (!response.ok || payload.erro) {
        setCepMessage("CEP não encontrado. Preencha manualmente.");
        return;
      }

      onChange("street", payload.logradouro ?? "");
      onChange("district", payload.bairro ?? "");
      onChange("city", payload.localidade ?? "");
      onChange("state", payload.uf ?? "");

      setCepMessage("Endereço preenchido. Confira os dados antes de continuar.");
    } catch {
      setCepMessage("Não foi possível consultar o CEP agora.");
    } finally {
      setIsLoadingCep(false);
    }
  }

  return (
    <div className="credpagos-form-grid">
      <div className="credpagos-form-group">
        <div className="credpagos-form-inline">
          <TextField
            label="CEP"
            name="zipcode"
            value={data.zipcode}
            error={errors["address.zipcode"]}
            onChange={(event) => onChange("zipcode", event.target.value)}
          />
        </div>

        {cepMessage ? (
          <span className="credpagos-form-error">{cepMessage}</span>
        ) : null}
      </div>

      <TextField
        label="Rua"
        name="street"
        value={data.street}
        error={errors["address.street"]}
        onChange={(event) => onChange("street", event.target.value)}
      />

      <TextField
        label="Número"
        name="number"
        value={data.number}
        error={errors["address.number"]}
        onChange={(event) => onChange("number", event.target.value)}
      />

      <TextField
        label="Complemento"
        name="complement"
        value={data.complement}
        onChange={(event) => onChange("complement", event.target.value)}
      />

      <TextField
        label="Bairro"
        name="district"
        value={data.district}
        error={errors["address.district"]}
        onChange={(event) => onChange("district", event.target.value)}
      />

      <TextField
        label="Cidade"
        name="city"
        value={data.city}
        error={errors["address.city"]}
        onChange={(event) => onChange("city", event.target.value)}
      />

      <TextField
        label="Estado"
        name="state"
        value={data.state}
        error={errors["address.state"]}
        onChange={(event) => onChange("state", event.target.value)}
      />
    </div>
  );
}