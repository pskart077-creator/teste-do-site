import type { ChangeEventHandler } from "react";
import { ACCOUNT_TYPE_OPTIONS, CREDIT_TERM_OPTIONS, PF_INCOME_TYPE_OPTIONS, REQUEST_PURPOSE_OPTIONS } from "@/components/credito/options";

type CommonFieldProps = {
  label: string;
  name: string;
  value: string | number;
  error?: string;
  type?: string;
  placeholder?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export function TextField({
  label,
  name,
  value,
  error,
  type = "text",
  placeholder,
  onChange,
}: CommonFieldProps) {
  return (
    <label className="credpagos-form-group">
      <span className="credpagos-form-label">{label}</span>
      <input
        className="credpagos-form-input"
        name={name}
        value={value}
        type={type}
        placeholder={placeholder}
        onChange={onChange}
      />
      {error ? <span className="credpagos-form-error">{error}</span> : null}
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  name: string;
  value: string | number;
  options: Array<string | { value: string | number; label: string }>;
  error?: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
};

export function SelectField({ label, name, value, options, error, onChange }: SelectFieldProps) {
  return (
    <label className="credpagos-form-group">
      <span className="credpagos-form-label">{label}</span>
      <select className="credpagos-form-select" name={name} value={value} onChange={onChange}>
        <option value="">Selecione</option>
        {options.map((item) => {
          const option = typeof item === "string"
            ? { value: item, label: item }
            : item;
          return (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
      {error ? <span className="credpagos-form-error">{error}</span> : null}
    </label>
  );
}

type TextAreaFieldProps = {
  label: string;
  name: string;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
};

export function TextAreaField({ label, name, value, error, placeholder, onChange }: TextAreaFieldProps) {
  return (
    <label className="credpagos-form-group">
      <span className="credpagos-form-label">{label}</span>
      <textarea
        className="credpagos-form-textarea"
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
      {error ? <span className="credpagos-form-error">{error}</span> : null}
    </label>
  );
}

type BoolFieldProps = {
  label: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export function BoolField({ label, checked, onChange }: BoolFieldProps) {
  return (
    <label className="credpagos-form-check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

export const SHARED_WIZARD_OPTIONS = {
  accountTypes: ACCOUNT_TYPE_OPTIONS,
  termOptions: CREDIT_TERM_OPTIONS.map((term) => ({ value: term, label: `${term} meses` })),
  purposeOptions: REQUEST_PURPOSE_OPTIONS,
  incomeTypes: PF_INCOME_TYPE_OPTIONS,
};
