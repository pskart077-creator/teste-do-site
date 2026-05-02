"use client";

import { useState } from "react";
import type { AdminCreditRule } from "@prisma/client";

type ApiResponse = {
  success: boolean;
  data?: {
    rules: AdminCreditRule;
  };
  error?: {
    message?: string;
  };
};

type AdminCreditRulesFormProps = {
  initialRules: AdminCreditRule;
};

export function AdminCreditRulesForm({
  initialRules,
}: AdminCreditRulesFormProps) {
  const [rules, setRules] = useState(initialRules);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function setNumberField(field: keyof AdminCreditRule, value: number) {
    setRules((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function setStringField(field: keyof AdminCreditRule, value: string) {
    setRules((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveRules() {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/credito/regras", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules),
      });

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || !payload.success || !payload.data?.rules) {
        setMessage(
          payload.error?.message ?? "Não foi possível salvar as regras."
        );
        return;
      }

      setRules(payload.data.rules);
      setMessage("Regras atualizadas com sucesso.");
    } catch {
      setMessage("Falha ao atualizar as regras.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="credpagos-admin-dashboard">
      <article className="credpagos-status-card">
        <h2 className="credpagos-credito-card-title">Limites por perfil</h2>

        <div className="credpagos-form-grid">
          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Valor mínimo PF</span>
            <input
              className="credpagos-form-input"
              type="number"
              value={rules.minAmountPf}
              onChange={(event) =>
                setNumberField("minAmountPf", Number(event.target.value))
              }
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Valor máximo PF</span>
            <input
              className="credpagos-form-input"
              type="number"
              value={rules.maxAmountPf}
              onChange={(event) =>
                setNumberField("maxAmountPf", Number(event.target.value))
              }
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Valor mínimo MEI</span>
            <input
              className="credpagos-form-input"
              type="number"
              value={rules.minAmountMei}
              onChange={(event) =>
                setNumberField("minAmountMei", Number(event.target.value))
              }
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Valor máximo MEI</span>
            <input
              className="credpagos-form-input"
              type="number"
              value={rules.maxAmountMei}
              onChange={(event) =>
                setNumberField("maxAmountMei", Number(event.target.value))
              }
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Valor mínimo PJ</span>
            <input
              className="credpagos-form-input"
              type="number"
              value={rules.minAmountPj}
              onChange={(event) =>
                setNumberField("minAmountPj", Number(event.target.value))
              }
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Valor máximo PJ</span>
            <input
              className="credpagos-form-input"
              type="number"
              value={rules.maxAmountPj}
              onChange={(event) =>
                setNumberField("maxAmountPj", Number(event.target.value))
              }
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">
              Percentual de ajuste operacional
            </span>
            <input
              className="credpagos-form-input"
              type="number"
              step="0.01"
              value={rules.defaultOperationalAdjustmentPercent}
              onChange={(event) =>
                setNumberField(
                  "defaultOperationalAdjustmentPercent",
                  Number(event.target.value)
                )
              }
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Score mínimo</span>
            <input
              className="credpagos-form-input"
              type="number"
              value={rules.minScore}
              onChange={(event) =>
                setNumberField("minScore", Number(event.target.value))
              }
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Prazo mínimo</span>
            <input
              className="credpagos-form-input"
              type="number"
              value={rules.minTerm}
              onChange={(event) =>
                setNumberField("minTerm", Number(event.target.value))
              }
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Prazo máximo</span>
            <input
              className="credpagos-form-input"
              type="number"
              value={rules.maxTerm}
              onChange={(event) =>
                setNumberField("maxTerm", Number(event.target.value))
              }
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">
              Taxa de juros padrão (%)
            </span>
            <input
              className="credpagos-form-input"
              type="number"
              step="0.01"
              value={rules.defaultInterestRate}
              onChange={(event) =>
                setNumberField(
                  "defaultInterestRate",
                  Number(event.target.value)
                )
              }
            />
          </label>
        </div>
      </article>

      <article className="credpagos-status-card">
        <h2 className="credpagos-credito-card-title">Mensagens do fluxo</h2>

        <div className="credpagos-form-grid credpagos-form-grid--one">
          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Mensagem de análise</span>
            <textarea
              className="credpagos-form-textarea"
              value={rules.analysisMessage}
              onChange={(event) =>
                setStringField("analysisMessage", event.target.value)
              }
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">
              Mensagem de pré-aprovação
            </span>
            <textarea
              className="credpagos-form-textarea"
              value={rules.preApprovedMessage}
              onChange={(event) =>
                setStringField("preApprovedMessage", event.target.value)
              }
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Mensagem de recusa</span>
            <textarea
              className="credpagos-form-textarea"
              value={rules.refusedMessage}
              onChange={(event) =>
                setStringField("refusedMessage", event.target.value)
              }
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">
              Mensagem de documentos pendentes
            </span>
            <textarea
              className="credpagos-form-textarea"
              value={rules.pendingDocumentsMessage}
              onChange={(event) =>
                setStringField("pendingDocumentsMessage", event.target.value)
              }
            />
          </label>

          <label className="credpagos-form-group">
            <span className="credpagos-form-label">Mensagem de liberação</span>
            <textarea
              className="credpagos-form-textarea"
              value={rules.releasedMessage}
              onChange={(event) =>
                setStringField("releasedMessage", event.target.value)
              }
            />
          </label>
        </div>
      </article>

      <div className="credpagos-admin-actions">
        <button
          type="button"
          className="credpagos-credito-button credpagos-credito-button--primary"
          disabled={isLoading}
          onClick={() => {
            void saveRules();
          }}
        >
          {isLoading ? "Salvando..." : "Salvar regras"}
        </button>
      </div>

      {message ? <p className="credpagos-alert">{message}</p> : null}
    </div>
  );
}