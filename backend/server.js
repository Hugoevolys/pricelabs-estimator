import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sampleV1, sampleV2 } from "./sampleData.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const API_KEY = process.env.PRICELABS_API_KEY;
const API_URL = "https://api.pricelabs.co/v1/revenue/estimator";

// ---- Persistance simple sur fichier (cache + compteur d'appels) ----
const DATA_FILE = path.join(__dirname, "cache-data.json");

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return { callsUsed: 0, cache: {} };
  }
}
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn("Impossible d'écrire le cache (FS en lecture seule ?):", e.message);
  }
}
let store = loadData();

// ---- Middleware ----
app.use(cors()); // en prod, restreins avec { origin: "https://ton-site.netlify.app" }
app.use(express.json());

// Clé de cache normalisée
function cacheKey(params) {
  return JSON.stringify({
    version: params.version,
    address: (params.address || "").trim().toLowerCase(),
    latitude: params.latitude,
    longitude: params.longitude,
    currency: (params.currency || "").toUpperCase(),
    bedrooms: params.bedrooms,
    monthly: params.monthly,
    filters: params.filters || null,
  });
}

// ---- Route: état (compteur informatif, sans plafond) ----
app.get("/api/status", (req, res) => {
  res.json({
    callsUsed: store.callsUsed,
    cachedQueries: Object.keys(store.cache).length,
    hasApiKey: Boolean(API_KEY),
  });
});

// ---- Route: estimation ----
app.get("/api/estimate", async (req, res) => {
  const {
    version = "2",
    address = "",
    latitude = "",
    longitude = "",
    currency = "EUR",
    bedrooms = "",
    monthly = "true",
    demo = "false",
    filters = "",
  } = req.query;

  // Validation minimale
  if (!address && !(latitude && longitude)) {
    return res.status(400).json({ error: "Fournis une adresse OU latitude+longitude." });
  }
  if (!currency) return res.status(400).json({ error: "La devise est requise." });
  if (!bedrooms) return res.status(400).json({ error: "Le nombre de chambres est requis." });

  const params = { version, address, latitude, longitude, currency, bedrooms, monthly, filters };
  const key = cacheKey(params);

  // 1) MODE DÉMO : aucune consommation d'appel
  if (demo === "true") {
    const data = version === "1" ? sampleV1 : sampleV2;
    return res.json({ source: "demo", callsUsed: store.callsUsed, data });
  }

  // 2) CACHE : si déjà interrogé, on ne reconsomme pas
  if (store.cache[key]) {
    return res.json({
      source: "cache",
      callsUsed: store.callsUsed,
      data: store.cache[key],
    });
  }

  // 3) Clé API requise pour un appel réel
  if (!API_KEY) {
    return res.status(500).json({ error: "Clé API absente côté serveur (PRICELABS_API_KEY)." });
  }

  // 4) Appel RÉEL à PriceLabs
  try {
    const url = new URL(API_URL);
    url.searchParams.set("version", version);
    if (address) url.searchParams.set("address", address);
    if (latitude) url.searchParams.set("latitude", latitude);
    if (longitude) url.searchParams.set("longitude", longitude);
    url.searchParams.set("currency", currency);
    // PriceLabs v2 attend le paramètre en snake_case : bedroom_category
    url.searchParams.set("bedroom_category", bedrooms);
    url.searchParams.set("monthly", monthly);
    if (filters) {
      // filters passé en JSON depuis le front → on le transmet en deepObject
      try {
        const f = JSON.parse(filters);
        flattenFilters(f, url.searchParams);
      } catch {
        /* ignore filtres invalides */
      }
    }

    const apiRes = await fetch(url.toString(), {
      method: "GET",
      headers: { "X-API-Key": API_KEY },
    });

    if (!apiRes.ok) {
      // Échec (401 clé invalide, 400 adresse, 429...) → on NE compte PAS l'appel.
      const text = await apiRes.text().catch(() => "");
      return res.status(apiRes.status).json({
        error: `Erreur API PriceLabs (${apiRes.status}).`,
        detail: text.slice(0, 500),
        callsUsed: store.callsUsed,
      });
    }

    // Succès uniquement → on compte l'appel et on met en cache.
    store.callsUsed += 1;
    const data = await apiRes.json();
    store.cache[key] = data; // mise en cache pour ne plus reconsommer
    saveData(store);

    return res.json({
      source: "api",
      callsUsed: store.callsUsed,
      data,
    });
  } catch (e) {
    return res.status(502).json({ error: "Impossible de joindre PriceLabs.", detail: e.message });
  }
});

// Transforme filters (objet) en paramètres deepObject: filters[pool]=1, filters[ratings][gt]=2 ...
function flattenFilters(obj, searchParams, prefix = "filters") {
  for (const [k, v] of Object.entries(obj)) {
    const paramKey = `${prefix}[${k}]`;
    if (v !== null && typeof v === "object") {
      flattenFilters(v, searchParams, paramKey);
    } else {
      searchParams.set(paramKey, v);
    }
  }
}

app.get("/", (_req, res) => res.send("PriceLabs Estimator backend OK"));

app.listen(PORT, () => {
  console.log(`Backend démarré sur http://localhost:${PORT}`);
  console.log(`Appels réels utilisés : ${store.callsUsed}`);
});
