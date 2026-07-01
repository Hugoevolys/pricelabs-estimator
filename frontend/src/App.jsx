import { useEffect, useState } from "react";
import EstimationForm from "./components/EstimationForm.jsx";
import ResultsPanel from "./components/ResultsPanel.jsx";
import { fetchEstimate, fetchStatus } from "./api.js";
import { normalize } from "./normalize.js";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [source, setSource] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [status, setStatus] = useState(null);

  async function refreshStatus() {
    try {
      setStatus(await fetchStatus());
    } catch {
      setStatus(null);
    }
  }
  useEffect(() => { refreshStatus(); }, []);

  async function handleSubmit(params) {
    setLoading(true);
    setError("");
    setResult(null);
    setCurrency(params.currency);
    try {
      const json = await fetchEstimate(params);
      const norm = normalize({ ...json.data, version: Number(params.version) });
      if (!norm) {
        setError("Aucune donnée disponible pour cette adresse.");
      } else {
        setResult(norm);
        setSource(json.source);
      }
      refreshStatus();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Estimateur de revenus — Location courte durée</h1>
        <p className="subtitle">Basé sur l'API PriceLabs Revenue Estimator</p>
        {status && (
          <div className="quota">
            Appels réels restants : <strong>{status.callsRemaining}/{status.maxCalls}</strong>
            {status.cachedQueries > 0 && ` · ${status.cachedQueries} en cache`}
          </div>
        )}
      </header>

      <main>
        <EstimationForm onSubmit={handleSubmit} loading={loading} />

        {error && <div className="error">{error}</div>}

        <ResultsPanel result={result} currency={currency} source={source} />
      </main>

      <footer>
        <p>
          Estimations à titre indicatif, basées sur les annonces Airbnb à proximité.
          Hors taxes et frais de ménage.
        </p>
      </footer>
    </div>
  );
}
