import MonthlyCharts from "./MonthlyCharts.jsx";

function money(v, currency) {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function ResultsPanel({ result, currency, source }) {
  if (!result) return null;
  const cats = Object.keys(result.categories);

  return (
    <div className="results">
      <div className="source-badge">
        {source === "demo" && "🧪 Données de démonstration (aucun appel consommé)"}
        {source === "cache" && "💾 Résultat en cache (aucun appel consommé)"}
        {source === "api" && "📡 Données réelles PriceLabs"}
      </div>

      {cats.map((cat) => {
        const c = result.categories[cat];
        return (
          <div key={cat} className="cat-block">
            <h2>{cat} chambre{Number(cat) > 1 ? "s" : ""}</h2>

            <div className="kpi-grid">
              <div className="kpi">
                <span className="kpi-label">Revenu annuel estimé</span>
                <span className="kpi-value">{money(c.revenueAnnuel, currency)}</span>
                {c.revenueBas != null && (
                  <span className="kpi-sub">
                    fourchette : {money(c.revenueBas, currency)} – {money(c.revenueHaut, currency)}
                  </span>
                )}
              </div>
              <div className="kpi">
                <span className="kpi-label">ADR (tarif moyen/nuit)</span>
                <span className="kpi-value">{money(c.adr, currency)}</span>
              </div>
              <div className="kpi">
                <span className="kpi-label">Taux d'occupation</span>
                <span className="kpi-value">{c.occupancy != null ? `${Math.round(c.occupancy)} %` : "—"}</span>
              </div>
              <div className="kpi">
                <span className="kpi-label">Annonces analysées</span>
                <span className="kpi-value">{c.nbListings ?? "—"}</span>
              </div>
            </div>

            <MonthlyCharts cat={c} />
          </div>
        );
      })}
    </div>
  );
}
