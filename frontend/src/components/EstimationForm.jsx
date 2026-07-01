import { useState } from "react";

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD"];

export default function EstimationForm({ onSubmit, loading }) {
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
  const [version, setVersion] = useState("2");
  const [demo, setDemo] = useState(true);

  // Filtres avancés (uniquement ceux réellement supportés par l'API PriceLabs)
  const [showFilters, setShowFilters] = useState(true); // ouverts par défaut
  const [bathrooms, setBathrooms] = useState("");   // salles de bain min
  const [maxGuest, setMaxGuest] = useState("");      // capacité min
  const [ratingMin, setRatingMin] = useState("");    // note min des comparables
  const [reviewMin, setReviewMin] = useState("");    // nombre d'avis min des comparables
  const [pool, setPool] = useState(false);
  const [hottub, setHottub] = useState(false);

  // Recompose une adresse propre : "12 rue de la Paix, 75002 Paris"
  function buildAddress() {
    const line1 = [streetNumber.trim(), street.trim()].filter(Boolean).join(" ");
    const line2 = [postalCode.trim(), city.trim()].filter(Boolean).join(" ");
    return [line1, line2].filter(Boolean).join(", ");
  }

  function buildFilters() {
    const f = {};
    if (pool) f.pool = 1;
    if (hottub) f.hottub = 1;
    if (bathrooms) f.bathroom = { gt: Number(bathrooms) - 1 }; // "au moins N"
    if (maxGuest) f.max_guest = { gt: Number(maxGuest) - 1 };
    if (ratingMin) f.ratings = { gt: Number(ratingMin) };
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
      version,
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
          Chambres (ex : 2 ou 1,2,3)
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
        <label>
          Version API
          <select value={version} onChange={(e) => setVersion(e.target.value)}>
            <option value="2">Version 2 (recommandée)</option>
            <option value="1">Version 1 (ancienne)</option>
          </select>
        </label>

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
          <div className="row">
            <label>
              Salles de bain (au moins)
              <input type="number" min="0" step="1" value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)} placeholder="ex : 1" />
            </label>
            <label>
              Capacité min (voyageurs)
              <input type="number" min="0" step="1" value={maxGuest}
                onChange={(e) => setMaxGuest(e.target.value)} placeholder="ex : 4" />
            </label>
          </div>
          <div className="row">
            <label>
              Note minimale (0–5)
              <input type="number" min="0" max="5" step="0.5" value={ratingMin}
                onChange={(e) => setRatingMin(e.target.value)} placeholder="ex : 4" />
            </label>
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
