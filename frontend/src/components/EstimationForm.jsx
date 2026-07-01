import { useState } from "react";

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD"];

export default function EstimationForm({ onSubmit, loading }) {
  const [address, setAddress] = useState("");
  const [bedrooms, setBedrooms] = useState("2");
  const [currency, setCurrency] = useState("EUR");
  const [version, setVersion] = useState("2");
  const [demo, setDemo] = useState(true);

  // Filtres avancés (uniquement ceux réellement supportés par l'API PriceLabs)
  const [showFilters, setShowFilters] = useState(false);
  const [bathrooms, setBathrooms] = useState("");   // salles de bain min
  const [maxGuest, setMaxGuest] = useState("");      // capacité min
  const [ratingMin, setRatingMin] = useState("");    // note min des comparables
  const [pool, setPool] = useState(false);
  const [hottub, setHottub] = useState(false);

  function buildFilters() {
    const f = {};
    if (pool) f.pool = 1;
    if (hottub) f.hottub = 1;
    if (bathrooms) f.bathroom = { gt: Number(bathrooms) - 1 }; // "au moins N"
    if (maxGuest) f.max_guest = { gt: Number(maxGuest) - 1 };
    if (ratingMin) f.ratings = { gt: Number(ratingMin) };
    return Object.keys(f).length ? JSON.stringify(f) : "";
  }

  function submit(e) {
    e.preventDefault();
    onSubmit({
      address: address.trim(),
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

      <label>
        Adresse complète du bien
        <input
          type="text"
          placeholder="ex : 12 rue de la Paix, 75002 Paris"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required={!demo}
        />
        <span className="hint">Numéro, rue, code postal et ville → meilleur géocodage.</span>
      </label>

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
