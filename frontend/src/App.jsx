import { useEffect, useRef, useState } from "react";
import EstimationForm from "./components/EstimationForm.jsx";
import ResultsPanel from "./components/ResultsPanel.jsx";
import { fetchEstimate, fetchStatus } from "./api.js";
import { normalize } from "./normalize.js";
import { downloadReportPdf } from "./pdf.js";

const EMPTY_ADVISOR = { name: "", city: "", rsac: "", address: "" };

function loadAdvisor() {
  try {
    return { ...EMPTY_ADVISOR, ...JSON.parse(localStorage.getItem("evolys.advisor") || "{}") };
  } catch {
    return EMPTY_ADVISOR;
  }
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [source, setSource] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [status, setStatus] = useState(null);
  const [propertyAddress, setPropertyAddress] = useState("");
  const [advisor, setAdvisor] = useState(loadAdvisor);
  const [pdfLoading, setPdfLoading] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("evolys.advisor", JSON.stringify(advisor));
  }, [advisor]);

  const advisorComplete =
    advisor.name && advisor.city && advisor.rsac && advisor.address;

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
    setPropertyAddress(params.address || "");
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

  async function handleDownloadPdf() {
    const el = resultsRef.current?.querySelector(".results");
    if (!el) return;
    setPdfLoading(true);
    try {
      await downloadReportPdf({
        resultsEl: el,
        advisor,
        address: propertyAddress,
        logoUrl: `${import.meta.env.BASE_URL}evolys-logo.svg`,
      });
    } catch (e) {
      setError("Échec de la génération du PDF : " + e.message);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="app">
      <header>
        <div className="brand-bar">
          <img src="/evolys-logo.svg" alt="Evolys" className="brand-logo" />
        </div>
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
        <EstimationForm
          onSubmit={handleSubmit}
          loading={loading}
          advisor={advisor}
          onAdvisorChange={setAdvisor}
        />

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="results-toolbar">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfLoading || !advisorComplete}
              title={!advisorComplete ? "Renseigne d'abord les informations du conseiller" : ""}
            >
              {pdfLoading ? "Génération du PDF…" : "⬇ Télécharger le compte rendu (PDF)"}
            </button>
            {!advisorComplete && (
              <span className="hint">
                Complète les informations du conseiller ci-dessus pour activer le PDF.
              </span>
            )}
          </div>
        )}

        <div ref={resultsRef}>
          <ResultsPanel result={result} currency={currency} source={source} />
        </div>
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
