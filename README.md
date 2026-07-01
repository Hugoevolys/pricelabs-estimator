# Estimateur de revenus — Location courte durée (PriceLabs)

Outil web pour estimer les revenus d'une location courte durée à partir d'une adresse,
d'un nombre de chambres et d'une devise, via l'API **PriceLabs Revenue Estimator**.

- **Frontend** : React + Vite + Recharts → déployé sur **Netlify**
- **Backend** : Node/Express (proxy) → déployé sur **Render**
- La clé API reste **côté serveur** (jamais exposée dans le navigateur).

## ⚠️ Important : 20 appels seulement

Tu ne disposes que de **20 appels gratuits**. Le projet est conçu pour les économiser :

1. **Mode démo** (activé par défaut) : utilise des données d'exemple, **0 appel consommé**.
   Idéal pour développer et tester toute l'interface.
2. **Cache** : chaque requête réelle est mise en cache. Refaire la **même** requête ne
   reconsomme pas d'appel.
3. **Compteur + garde-fou** : le backend bloque automatiquement au-delà de `MAX_REAL_CALLS`
   (20 par défaut) et affiche le nombre d'appels restants.

Décoche « Mode démo » uniquement quand tu veux une vraie estimation.

## Lancer en local

Deux terminaux.

### 1. Backend
```bash
cd backend
cp .env.example .env      # puis renseigne PRICELABS_API_KEY (déjà rempli dans ton .env)
npm install
npm run dev               # http://localhost:3001
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

En local, Vite redirige automatiquement `/api` vers `http://localhost:3001`.
Tu peux tester en **mode démo** sans jamais toucher tes 20 appels.

## Déploiement

### Backend sur Render
1. Pousse le repo sur GitHub.
2. Sur Render : **New > Blueprint**, sélectionne le repo (il lit `render.yaml`).
   Ou **New > Web Service**, `Root Directory = backend`, build `npm install`, start `npm start`.
3. Dans **Environment**, ajoute :
   - `PRICELABS_API_KEY` = ta clé
   - `MAX_REAL_CALLS` = `20`
4. Note l'URL publique, ex : `https://pricelabs-estimator-backend.onrender.com`

### Frontend sur Netlify
1. Sur Netlify : **Add new site > Import from Git**, sélectionne le repo.
2. `Base directory = frontend`, build `npm run build`, publish `dist` (déjà dans `netlify.toml`).
3. Dans **Site settings > Environment variables**, ajoute :
   - `VITE_API_BASE` = l'URL Render du backend
4. Déploie.

> Sur Render (plan gratuit), le service s'endort après inactivité : le premier appel
> peut prendre ~30 s à réveiller le serveur.

## Sécurité
- La clé n'est **jamais** dans le code frontend, seulement en variable d'env côté backend.
- Le `.env` est ignoré par git (`.gitignore`).
- En production, tu peux restreindre le CORS dans `backend/server.js`
  (`cors({ origin: "https://ton-site.netlify.app" })`).

## API PriceLabs — rappel
- Endpoint : `GET https://api.pricelabs.co/v1/revenue/estimator`
- Header : `X-API-Key`
- Paramètres requis : `address` (ou `latitude`+`longitude`), `currency`, `Bedroom category`
- Optionnels : `version` (1 ou 2), `Monthly`, `filters` (piscine, jacuzzi, note…)
- Version 2 recommandée (plus de métriques, meilleure méthodo).
