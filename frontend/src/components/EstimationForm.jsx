import { useState } from "react";
import AdvisorFields from "./AdvisorFields.jsx";

export default function EstimationForm({ onSubmit, loading, advisor, onAdvisorChange }) {
  // Adresse découpée en champs distincts (recomposée avant l'envoi)
  const [streetNumber, setStreetNumber] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  // Coordonnées GPS optionnelles (calent la localisation précisément si renseignées)
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [bedrooms, setBedrooms] = useState("2");

  // Filtres (uniquement ceux réellement supportés par l'API PriceLabs)
  const [bathrooms, setBathrooms] = useState("");    // nombre de salles de bain
  const [guestMin, setGuestMin] = useState("");      // capacité min
  const [guestMax, setGuestMax] = useState("");      // capacité max
  const [pool, setPool] = useState(false);
  const [hottub, setHottub] = useState(false);

  // Recompose une adresse propre : "12 rue de la Paix, 75002 Paris"
  function buildAddress() {
    const line1 = [streetNumber.trim(), street.trim()].filter(Boolean).join(" ");
    const line2 = [postalCode.trim(), city.trim()].filter(Boolean).join(" ");
    return [line1, line2].filter(Boolean).join(", ");
  }

  // Encadre une valeur entière : gt = min-1 (≥ min), lt = max+1 (≤ max)
  function intRange(min, max) {
    const o = {};
    if (min !== "") o.gt = Number(min) - 1;
    if (max !== "") o.lt = Number(max) + 1;
    return Object.keys(o).length ? o : null;
  }

  function buildFilters() {
    const f = {};
    if (pool) f.pool = 1;
    if (hottub) f.hottub = 1;
    // Salles de bain : nombre exact (entre N-1 et N+1 exclus)
    if (bathrooms !== "") f.bathroom = { gt: Number(bathrooms) - 1, lt: Number(bathrooms) + 1 };
    const guests = intRange(guestMin, guestMax);
    if (guests) f.max_guest = guests;
    // Toujours : ne comparer qu'avec des logements bien notés (note entre 4 et 5)
    f.ratings = { gt: 4, lt: 5 };
    return Object.keys(f).length ? JSON.stringify(f) : "";
  }

  function submit(e) {
    e.preventDefault();
    onSubmit({
      address: buildAddress(),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      bedrooms: bedrooms.trim(),
      currency: "EUR",
      version: "2",
      monthly: "true",
      demo: "false",
      filters: buildFilters(),
    });
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h2>Paramètres de l'estimation</h2>

      <fieldset className="address-group">
        <legend>Adresse du bien</legend>
        <div className="row">
          <label className="col-num">
            Numéro
            <input
              type="text"
              placeholder="ex : 12"
              value={streetNumber}
              onChange={(e) => setStreetNumber(e.target.value)}
            />
          </label>
          <label className="col-grow">
            Rue
            <input
              type="text"
              placeholder="ex : rue de la Paix"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="row">
          <label className="col-num">
            Code postal
            <input
              type="text"
              inputMode="numeric"
              placeholder="ex : 75002"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
            />
          </label>
          <label className="col-grow">
            Ville
            <input
              type="text"
              placeholder="ex : Paris"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </label>
        </div>
        <span className="hint">Numéro, rue, code postal et ville → meilleur géocodage.</span>
        <div className="row">
          <label>
            Latitude <span className="opt">(optionnel)</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="ex : 48.8698"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
          </label>
          <label>
            Longitude <span className="opt">(optionnel)</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="ex : 2.3078"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </label>
        </div>
        <span className="hint">
          Si renseignées, les coordonnées GPS calent la localisation précisément (prioritaire sur l'adresse).
        </span>
      </fieldset>

      <div className="row">
        <label>
          Chambres (ex : 2 )
          <input
            type="text"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="row">
        <label>
          Salles de bain
          <input type="number" min="0" step="1" value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)} placeholder="ex : 1" />
        </label>
        <div className="range">
          <span className="range-label">Capacité (voyageurs)</span>
          <div className="range-inputs">
            <input type="number" min="0" step="1" value={guestMin}
              onChange={(e) => setGuestMin(e.target.value)} placeholder="min" aria-label="Capacité min" />
            <span className="range-sep">–</span>
            <input type="number" min="0" step="1" value={guestMax}
              onChange={(e) => setGuestMax(e.target.value)} placeholder="max" aria-label="Capacité max" />
          </div>
        </div>
      </div>

      <div className="filter-checks">
        <label className="checkbox">
          <input type="checkbox" checked={pool} onChange={(e) => setPool(e.target.checked)} />
          Piscine
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={hottub} onChange={(e) => setHottub(e.target.checked)} />
          Jacuzzi
        </label>
      </div>

      <AdvisorFields value={advisor} onChange={onAdvisorChange} />

      <button type="submit" disabled={loading}>
        {loading ? "Estimation en cours…" : "Estimer les revenus"}
      </button>
    </form>
  );
}
