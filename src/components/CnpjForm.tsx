import { useState, type FormEvent } from 'react';
import { isValidCnpj, maskCnpj, onlyDigits } from '../utils/masks';
import { SearchIcon, SpinnerIcon } from './Icons';

type CnpjFormProps = {
  loading: boolean;
  onSubmit: (cnpjDigits: string) => void;
};

export function CnpjForm({ loading, onSubmit }: CnpjFormProps) {
  const [value, setValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const digits = onlyDigits(value);
    if (digits.length !== 14) {
      setValidationError('Informe os 14 dígitos do CNPJ.');
      return;
    }
    if (!isValidCnpj(digits)) {
      setValidationError('CNPJ inválido: os dígitos verificadores não conferem.');
      return;
    }
    setValidationError(null);
    onSubmit(digits);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="cnpj-input" className="mb-1.5 block text-sm font-medium text-ink-soft">
        CNPJ
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="cnpj-input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="00.000.000/0000-00"
          value={value}
          onChange={(e) => {
            setValue(maskCnpj(e.target.value));
            setValidationError(null);
          }}
          aria-invalid={validationError !== null}
          aria-describedby={validationError ? 'cnpj-error' : undefined}
          className="flex-1 rounded-lg border border-border-soft bg-white px-4 py-2.5 text-ink placeholder:text-ink-muted shadow-sm transition-colors focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/30 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-orange px-6 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-brand-orange-dark hover:shadow-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <SpinnerIcon /> : <SearchIcon />}
          {loading ? 'Consultando…' : 'Consultar'}
        </button>
      </div>
      {validationError && (
        <p id="cnpj-error" role="alert" className="mt-2 text-sm font-medium text-danger">
          {validationError}
        </p>
      )}
    </form>
  );
}
