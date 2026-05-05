"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type SearchableProfessionSelectProps = {
  id: string;
  name?: string;
  label: string;
  value: string;
  options: readonly string[];
  error?: string;
  onChange: (value: string) => void;
};

export function SearchableProfessionSelect({
  id,
  name,
  label,
  value,
  options,
  error,
  onChange,
}: SearchableProfessionSelectProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current) {
        return;
      }

      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return options;
    }

    return options.filter((item) => item.toLowerCase().includes(normalized));
  }, [options, query]);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setQuery(nextValue);
    setIsOpen(false);
  }

  const inputName = name ?? id;
  const isFilled = query.trim().length > 0;

  return (
    <div
      className={`credpagos-card-field credpagos-card-field--floating${isFilled ? " is-filled" : ""}`}
      ref={wrapperRef}
    >
      <div className={`credpagos-card-searchable ${isOpen ? "is-open" : ""}`}>
        <input
          id={id}
          name={inputName}
          type="text"
          placeholder=" "
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            setIsOpen(true);
            onChange(nextValue);
          }}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
          role="combobox"
        />
        <label htmlFor={id}>{label}</label>

        <button
          type="button"
          className="credpagos-card-searchable__toggle"
          aria-label="Abrir opções de profissão"
          onClick={() => setIsOpen((current) => !current)}
        >
          <ChevronDown aria-hidden="true" size={18} />
        </button>
      </div>

      {isOpen ? (
        <ul id={`${id}-listbox`} role="listbox" className="credpagos-card-searchable__list">
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  className={value === option ? "is-selected" : ""}
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </button>
              </li>
            ))
          ) : (
            <li className="credpagos-card-searchable__empty">Nenhuma profissão encontrada.</li>
          )}
        </ul>
      ) : null}

      {error ? <span className="credpagos-form-error">{error}</span> : null}
    </div>
  );
}
