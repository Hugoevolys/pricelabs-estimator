// En dev, VITE_API_BASE est vide → on utilise /api (proxy Vite vers localhost:3001).
// En prod, VITE_API_BASE = URL Render.
const BASE = import.meta.env.VITE_API_BASE || "";

export async function fetchEstimate(params) {
  const q = new URLSearchParams(params);
  const res = await fetch(`${BASE}/api/estimate?${q.toString()}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Erreur inconnue");
  return json;
}

export async function fetchStatus() {
  const res = await fetch(`${BASE}/api/status`);
  if (!res.ok) throw new Error("Statut indisponible");
  return res.json();
}
