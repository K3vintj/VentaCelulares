import { Icon } from "@/components/ui";
import { COATZACOALCOS } from "@/config/maps";
import { useId, useState } from "react";

type Mode = "local" | "national";
const copy = {
  local: {
    control: "Entrega local",
    title: "Entrega local en Coatzacoalcos",
    description:
      "Coordina el punto y horario de entrega directamente con nosotros.",
  },
  national: {
    control: "Envío nacional",
    title: "Envíos dentro de México",
    description:
      "Consulta la disponibilidad, el costo y las condiciones de envío a tu destino.",
  },
};
export function DeliveryModesCard() {
  const id = useId();
  const [mode, setMode] = useState<Mode>("local");
  const source =
    "https://maps.google.com/maps?" +
    new URLSearchParams({
      q: mode === "local" ? COATZACOALCOS.label : "México",
      z: mode === "local" ? "12" : "5",
      output: "embed",
      hl: "es",
    });
  const external =
    mode === "local"
      ? COATZACOALCOS.mapsUrl
      : "https://www.google.com/maps/search/?api=1&query=Mexico";
  return (
    <article className="contact-card delivery-modes-card">
      <header className="delivery-modes-header">
        <h2 className="footer-heading">Modalidades de entrega</h2>
        <span className="delivery-modes-icon" aria-hidden="true">
          <Icon name="pin" size={18} />
        </span>
      </header>
      <div
        className="delivery-mode-switch"
        role="radiogroup"
        aria-label="Seleccionar modalidad de entrega"
      >
        {(["local", "national"] as const).map((value) => (
          <button
            key={value}
            id={`${id}-${value}`}
            type="button"
            role="radio"
            aria-checked={mode === value}
            className={`delivery-mode-option${mode === value ? " is-active" : ""}`}
            onClick={() => setMode(value)}
          >
            <span className="delivery-mode-option-label">
              {copy[value].control}
            </span>
          </button>
        ))}
      </div>
      <div className="delivery-map-shell">
        <iframe
          key={mode}
          className="delivery-map-embed"
          title={
            mode === "local"
              ? "Mapa de referencia de Coatzacoalcos"
              : "Mapa de referencia de México"
          }
          src={source}
          loading="lazy"
          referrerPolicy="no-referrer"
          allowFullScreen
        />
      </div>
      <div className="delivery-mode-info">
        <p className="delivery-mode-info-title">
          <Icon name="pin" size={16} />
          <span>{copy[mode].title}</span>
        </p>
        <p className="delivery-mode-info-text">{copy[mode].description}</p>
        <p className="delivery-map-reference">
          El mapa muestra una zona de referencia, no la dirección del negocio.
        </p>
        <a
          href={external}
          target="_blank"
          rel="noopener noreferrer"
          className="delivery-map-external"
        >
          {mode === "local"
            ? "Ver Coatzacoalcos en Google Maps"
            : "Ver México en Google Maps"}{" "}
          ↗
        </a>
      </div>
    </article>
  );
}
