import {
  ADMIN_PROFILE_OPTIONS,
  ADMIN_STATUS_OPTIONS,
} from "@/components/credito/options";

type AdminCreditFiltersProps = {
  query: string;
  profileType: string;
  status: string;
  onChange: (next: {
    query?: string;
    profileType?: string;
    status?: string;
  }) => void;
};

export function AdminCreditFilters({
  query,
  profileType,
  status,
  onChange,
}: AdminCreditFiltersProps) {
  return (
    <div className="credpagos-admin-filter">
      <label className="credpagos-form-group">
        <span className="credpagos-form-label">Busca</span>
        <input
          className="credpagos-form-input"
          value={query}
          placeholder="Nome, CPF, CNPJ ou protocolo"
          onChange={(event) => onChange({ query: event.target.value })}
        />
      </label>

      <label className="credpagos-form-group">
        <span className="credpagos-form-label">Perfil</span>
        <select
          className="credpagos-form-select"
          value={profileType}
          onChange={(event) => onChange({ profileType: event.target.value })}
        >
          {ADMIN_PROFILE_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="credpagos-form-group">
        <span className="credpagos-form-label">Status</span>
        <select
          className="credpagos-form-select"
          value={status}
          onChange={(event) => onChange({ status: event.target.value })}
        >
          {ADMIN_STATUS_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}