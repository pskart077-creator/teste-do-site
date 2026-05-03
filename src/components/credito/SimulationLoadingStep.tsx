import Image from "next/image";

export function SimulationLoadingStep() {
  return (
    <div className="credpagos-simulation-loading-shell" aria-live="polite">
      <article className="credpagos-simulation-loading-card">
        <Image
          src="/assets/img/logo/logo.svg"
          alt="Credpago"
          width={54}
          height={54}
          className="credpagos-simulation-loading-logo"
        />

        <h2>Simulando...</h2>

        <p>Estamos calculando sua simulação.</p>
      </article>
    </div>
  );
}
