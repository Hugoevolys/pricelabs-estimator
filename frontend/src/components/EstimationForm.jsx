import { useState } from "react";
import AdvisorFields from "./AdvisorFields.jsx";

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD"];

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
  const [currency, setCurrency] = useState("EUR");
  const [demo, setDemo] = useState(true);

  // Filtres avancés (uniquement ceux réellement supportés par l'API PriceLabs)
  const [showFilters, setShowFilters] = useState(true); // ouverts par défaut
  const [bathMin, setBathMin] = useState("");        // salles de bain min
  const [bathMax, setBathMax] = useState("");        // salles de bain max
  const [guestMin, setGuestMin] = useState("");      // capacité min
  const [guestMax, setGuestMax] = useState("");      // capacité max
  const [ratingMin, setRatingMin] = useState("");    // note min des comparables
  const [ratingMax, setRatingMax] = useState("");    // note max des comparables
  const [reviewMin, setReviewMin] = useState("");    // nombre d'avis min des comparables
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
    const bath = intRange(bathMin, bathMax);
    if (bath) f.bathroom = bath;
    const guests = intRange(guestMin, guestMax);
    if (guests) f.max_guest = guests;
    // Note (décimale) : bornes directes
    const rating = {};
    if (ratingMin !== "") rating.gt = Number(ratingMin);
    if (ratingMax !== "") rating.lt = Number(ratingMax);
    if (Object.keys(rating).length) f.ratings = rating;
    if (reviewMin) f.review_count = { gt: Number(reviewMin) - 1 }; // "au moins N avis"
    return Object.keys(f).length ? JSON.stringify(f) : "";
  }

  function submit(e) {
    e.preventDefault();
    onSubmit({
      address: buildAddress(),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      bedrooms: bedrooms.trim(),
      currency,
      version: "2",
      monthly: "true",
      demo: demo ? "true" : "false",
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
              required={!demo}
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
              required={!demo}
            />
          </label>
          <label className="col-grow">
            Ville
            <input
              type="text"
              placeholder="ex : Paris"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required={!demo}
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

        <label>
          Devise
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="row">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={demo}
            onChange={(e) => setDemo(e.target.checked)}
          />
          Mode démo (ne consomme aucun appel)
        </label>
      </div>

      <button
        type="button"
        className="link-btn"
        onClick={() => setShowFilters((s) => !s)}
      >
        {showFilters ? "▾ Masquer les filtres avancés" : "▸ Filtres avancés (plus de précision)"}
      </button>

      {showFilters && (
        <div className="filters">
          <p className="hint">
            Ces filtres restreignent l'échantillon aux annonces similaires à ton bien.
          </p>
          <p className="hint">Laisse min et/ou max vides pour ne pas borner ce critère.</p>
          <div className="row">
            <div className="range">
              <span className="range-label">Salles de bain</span>
              <div className="range-inputs">
                <input type="number" min="0" step="1" value={bathMin}
                  onChange={(e) => setBathMin(e.target.value)} placeholder="min" aria-label="Salles de bain min" />
                <span className="range-sep">–</span>
                <input type="number" min="0" step="1" value={bathMax}
                  onChange={(e) => setBathMax(e.target.value)} placeholder="max" aria-label="Salles de bain max" />
              </div>
            </div>
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
          <div className="row">
            <div className="range">
              <span className="range-label">Note (0–5)</span>
              <div className="range-inputs">
                <input type="number" min="0" max="5" step="0.5" value={ratingMin}
                  onChange={(e) => setRatingMin(e.target.value)} placeholder="min" aria-label="Note min" />
                <span className="range-sep">–</span>
                <input type="number" min="0" max="5" step="0.5" value={ratingMax}
                  onChange={(e) => setRatingMax(e.target.value)} placeholder="max" aria-label="Note max" />
              </div>
            </div>
            <label>
              Nombre d'avis min
              <input type="number" min="0" step="1" value={reviewMin}
                onChange={(e) => setReviewMin(e.target.value)} placeholder="ex : 10" />
            </label>
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
          <p className="hint">
            En mode démo, les filtres sont ignorés (données d'exemple fixes).
          </p>
        </div>
      )}

      <AdvisorFields value={advisor} onChange={onAdvisorChange} />

      <button type="submit" disabled={loading}>
        {loading ? "Estimation en cours…" : "Estimer les revenus"}
      </button>

      {!demo && (
        <p className="warn">
          ⚠️ Mode réel : cette estimation consommera 1 de tes 20 appels
          (sauf si la même requête est déjà en cache).
        </p>
      )}
    </form>
  );
}
