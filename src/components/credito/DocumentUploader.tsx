"use client";

import { useMemo, useState } from "react";
import type { UploadedDocument, WizardMode } from "@/components/credito/types";
import { createLocalDocumentId } from "@/components/credito/defaults";

type DocumentUploaderProps = {
  documents: UploadedDocument[];
  onDocumentsChange: (next: UploadedDocument[]) => void;
  mode?: WizardMode;
};

type UploadResponse = {
  success: boolean;
  data?: {
    fileUrl: string;
    fileName: string;
    mimeType: string;
    size: number;
  };
  error?: {
    message: string;
  };
};

type RequiredDocument = {
  type: string;
  title: string;
  description: string;
  required?: boolean;
};

const DOCUMENTS_BY_MODE: Record<WizardMode, RequiredDocument[]> = {
  PF: [
    {
      type: "documento_com_foto",
      title: "Documento com foto",
      description: "RG, CNH ou documento oficial com foto.",
      required: true,
    },
    {
      type: "comprovante_residencia",
      title: "Comprovante de residência",
      description: "Conta de água, luz, internet ou telefone dos últimos 90 dias.",
      required: true,
    },
    {
      type: "comprovante_renda",
      title: "Comprovante de renda",
      description: "Holerite, extrato, declaração ou outro comprovante de renda.",
      required: true,
    },
    {
      type: "selfie",
      title: "Selfie do solicitante",
      description: "Foto atual para conferência de identidade.",
      required: true,
    },
    {
      type: "extrato_bancario",
      title: "Extrato bancário",
      description: "Extrato recente para auxiliar na análise financeira.",
      required: false,
    },
  ],

  MEI: [
    {
      type: "documento_responsavel",
      title: "Documento do responsável",
      description: "RG, CNH ou documento oficial com foto do titular do MEI.",
      required: true,
    },
    {
      type: "ccmei",
      title: "CCMEI",
      description: "Certificado da Condição de Microempreendedor Individual.",
      required: true,
    },
    {
      type: "comprovante_endereco",
      title: "Comprovante de endereço",
      description: "Comprovante residencial ou comercial dos últimos 90 dias.",
      required: true,
    },
    {
      type: "extrato_bancario",
      title: "Extrato bancário",
      description: "Extrato recente da conta utilizada no negócio.",
      required: true,
    },
    {
      type: "comprovante_faturamento",
      title: "Comprovante de faturamento",
      description: "Declaração, relatório, DASN-SIMEI ou comprovante equivalente.",
      required: false,
    },
  ],

  PJ: [
    {
      type: "contrato_social",
      title: "Contrato social",
      description: "Contrato social ou última alteração contratual da empresa.",
      required: true,
    },
    {
      type: "cartao_cnpj",
      title: "Cartão do CNPJ",
      description: "Comprovante de inscrição e situação cadastral da empresa.",
      required: true,
    },
    {
      type: "documentos_socios",
      title: "Documentos dos sócios",
      description: "Documentos oficiais com foto dos principais sócios.",
      required: true,
    },
    {
      type: "comprovante_endereco_empresa",
      title: "Comprovante de endereço da empresa",
      description: "Comprovante comercial atualizado.",
      required: true,
    },
    {
      type: "extratos_bancarios",
      title: "Extratos bancários",
      description: "Extratos recentes da conta da empresa.",
      required: true,
    },
    {
      type: "comprovante_faturamento",
      title: "Comprovante de faturamento",
      description: "Relatório financeiro, notas, declaração contábil ou equivalente.",
      required: true,
    },
    {
      type: "balanco_dre",
      title: "Balanço ou DRE",
      description: "Balanço patrimonial, DRE ou demonstrativo financeiro, se houver.",
      required: false,
    },
  ],
};

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${(size / 1024).toFixed(1)} KB`;
}

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop();

  return extension ? extension.toUpperCase() : "ARQUIVO";
}

export function DocumentUploader({
  documents,
  onDocumentsChange,
  mode = "PF",
}: DocumentUploaderProps) {
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const requiredDocuments = useMemo(() => {
    return DOCUMENTS_BY_MODE[mode] ?? DOCUMENTS_BY_MODE.PF;
  }, [mode]);

  const uploadedByType = useMemo(() => {
    return documents.reduce<Record<string, UploadedDocument>>((acc, doc) => {
      acc[doc.type] = doc;
      return acc;
    }, {});
  }, [documents]);

  const requiredCount = requiredDocuments.filter((doc) => doc.required).length;

  const uploadedRequiredCount = requiredDocuments.filter((doc) => {
    return doc.required && uploadedByType[doc.type];
  }).length;

  async function handleFileChange(documentType: string, file: File | null) {
    if (!file) {
      return;
    }

    setUploadingType(documentType);
    setErrors((current) => ({
      ...current,
      [documentType]: "",
    }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", documentType);

      const response = await fetch("/api/credito/uploads", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as UploadResponse;

      if (!response.ok || !payload.success || !payload.data) {
        setErrors((current) => ({
          ...current,
          [documentType]:
            payload.error?.message ?? "Não foi possível enviar o arquivo.",
        }));
        return;
      }

      const nextDocument: UploadedDocument = {
        localId: createLocalDocumentId(),
        type: documentType,
        fileUrl: payload.data.fileUrl,
        fileName: payload.data.fileName,
        mimeType: payload.data.mimeType,
        size: payload.data.size,
      };

      const documentsWithoutCurrentType = documents.filter(
        (doc) => doc.type !== documentType
      );

      onDocumentsChange([...documentsWithoutCurrentType, nextDocument]);
    } catch {
      setErrors((current) => ({
        ...current,
        [documentType]: "Erro ao enviar o documento. Tente novamente.",
      }));
    } finally {
      setUploadingType(null);
    }
  }

  function removeDocument(documentType: string) {
    onDocumentsChange(documents.filter((doc) => doc.type !== documentType));
  }

  return (
    <div className="credpagos-doc-upload">
      <div className="credpagos-doc-upload-header">
        <div>
          <span className="credpagos-form-kicker">Documentos</span>

          <h3 className="credpagos-form-section-title">
            Envie os documentos necessários
          </h3>

          <p className="credpagos-form-section-description">
            Cada campo abaixo corresponde a um documento solicitado para a
            análise. Os arquivos aceitos são PDF, PNG, JPG, JPEG e WEBP.
          </p>
        </div>

        <div className="credpagos-doc-upload-counter">
          <strong>
            {uploadedRequiredCount}/{requiredCount}
          </strong>
          <span>obrigatórios enviados</span>
        </div>
      </div>

      <div className="credpagos-doc-upload-grid">
        {requiredDocuments.map((documentItem) => {
          const uploadedDocument = uploadedByType[documentItem.type];
          const isUploading = uploadingType === documentItem.type;
          const inputId = `document-${documentItem.type}`;

          return (
            <article
              className="credpagos-doc-upload-card"
              key={documentItem.type}
            >
              <div className="credpagos-doc-upload-card-content">
                <div className="credpagos-doc-upload-card-top">
                  <div>
                    <h4 className="credpagos-doc-upload-title">
                      {documentItem.title}
                    </h4>

                    <p className="credpagos-doc-upload-description">
                      {documentItem.description}
                    </p>
                  </div>

                  <span
                    className={
                      documentItem.required
                        ? "credpagos-doc-upload-badge credpagos-doc-upload-badge--required"
                        : "credpagos-doc-upload-badge"
                    }
                  >
                    {documentItem.required ? "Obrigatório" : "Opcional"}
                  </span>
                </div>

                {uploadedDocument ? (
                  <div className="credpagos-doc-upload-file">
                    <div className="credpagos-doc-upload-file-icon">
                      {getFileExtension(uploadedDocument.fileName)}
                    </div>

                    <div className="credpagos-doc-upload-file-info">
                      <strong>{uploadedDocument.fileName}</strong>
                      <span>{formatFileSize(uploadedDocument.size)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="credpagos-doc-upload-empty">
                    Nenhum arquivo enviado para este documento.
                  </div>
                )}

                {errors[documentItem.type] ? (
                  <span className="credpagos-form-error">
                    {errors[documentItem.type]}
                  </span>
                ) : null}
              </div>

              <div className="credpagos-doc-upload-actions">
                <label
                  className={
                    isUploading
                      ? "credpagos-credito-button credpagos-credito-button--disabled"
                      : "credpagos-credito-button"
                  }
                  htmlFor={inputId}
                >
                  {isUploading
                    ? "Enviando..."
                    : uploadedDocument
                      ? "Substituir arquivo"
                      : "Enviar arquivo"}
                </label>

                <input
                  id={inputId}
                  className="credpagos-doc-upload-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  disabled={isUploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    void handleFileChange(documentItem.type, file);
                    event.currentTarget.value = "";
                  }}
                />

                {uploadedDocument ? (
                  <button
                    type="button"
                    className="credpagos-credito-button credpagos-credito-button--ghost"
                    onClick={() => removeDocument(documentItem.type)}
                  >
                    Remover
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}