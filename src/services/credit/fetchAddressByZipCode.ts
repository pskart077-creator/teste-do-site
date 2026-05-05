type ZipCodeLookupResult = {
  street: string;
  neighborhood: string;
  state: string;
  city: string;
};

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

export async function fetchAddressByZipCode(zipCode: string): Promise<ZipCodeLookupResult> {
  const cleanZipCode = onlyNumbers(zipCode);

  if (cleanZipCode.length !== 8) {
    throw new Error("CEP inválido.");
  }

  const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`);

  if (!response.ok) {
    throw new Error("Não foi possível consultar o CEP.");
  }

  const payload = (await response.json()) as {
    logradouro?: string;
    bairro?: string;
    uf?: string;
    localidade?: string;
    erro?: boolean;
  };

  if (payload.erro) {
    throw new Error("CEP não encontrado.");
  }

  return {
    street: payload.logradouro ?? "",
    neighborhood: payload.bairro ?? "",
    state: payload.uf ?? "",
    city: payload.localidade ?? "",
  };
}
