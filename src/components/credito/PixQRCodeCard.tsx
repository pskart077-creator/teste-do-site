"use client";

import Image from "next/image";
import { useState } from "react";
import type { PixCharge } from "@prisma/client";
import { formatCurrencyBrl } from "@/lib/credit/helpers";

type PixQRCodeCardProps = {
  charge: PixCharge;
};

export function PixQRCodeCard({ charge }: PixQRCodeCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopyPixCode() {
    if (!charge.copyPaste) {
      return;
    }

    try {
      await navigator.clipboard.writeText(charge.copyPaste);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="credpagos-pix-card">
      <h3 className="credpagos-credito-card-title">
        Pix — cobrança vinculada ao contrato
      </h3>

      <div className="credpagos-key-value">
        <span>Tipo</span>
        <strong>{charge.type}</strong>
      </div>

      <div className="credpagos-key-value">
        <span>Valor</span>
        <strong>{formatCurrencyBrl(charge.amount)}</strong>
      </div>

      <div className="credpagos-key-value">
        <span>Status</span>
        <strong>{charge.status}</strong>
      </div>

      {charge.qrCode ? (
        <Image
          src={charge.qrCode}
          alt="QR Code para pagamento Pix"
          width={220}
          height={220}
          unoptimized
        />
      ) : null}

      {charge.copyPaste ? (
        <label className="credpagos-form-group">
          <span className="credpagos-form-label">Pix copia e cola</span>

          <textarea
            className="credpagos-form-textarea"
            value={charge.copyPaste}
            readOnly
          />

          <button
            type="button"
            className="credpagos-credito-button credpagos-credito-button--primary"
            onClick={handleCopyPixCode}
          >
            {copied ? "Código copiado" : "Copiar código Pix"}
          </button>
        </label>
      ) : null}

      <p className="credpagos-alert">
        O Pix é utilizado apenas para obrigações previstas em contrato,
        parcelas, quitação, entrada contratual permitida ou cobrança
        administrativa autorizada.
      </p>
    </article>
  );
}