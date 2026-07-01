// Normalise les réponses v1 et v2 de PriceLabs vers un format unique
// exploitable par l'interface.

const MONTH_ORDER = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_FR = {
  January: "Janv", February: "Févr", March: "Mars", April: "Avr",
  May: "Mai", June: "Juin", July: "Juil", August: "Août",
  September: "Sept", October: "Oct", November: "Nov", December: "Déc",
};

function orderMonths(obj = {}) {
  return MONTH_ORDER
    .filter((m) => obj[m] !== undefined)
    .map((m) => ({ mois: MONTH_FR[m], _key: m, value: obj[m] }));
}

export function normalize(data) {
  if (!data || !data.KPIsByBedroomCategory) return null;
  const version = data.version || (data.bedrooms_considered ? 2 : 1);
  const categories = Object.keys(data.KPIsByBedroomCategory).sort(
    (a, b) => Number(a) - Number(b)
  );

  const result = { version, categories: {} };

  for (const cat of categories) {
    const k = data.KPIsByBedroomCategory[cat];
    if (version === 2) {
      const mb = k.MonthlyBreakup || {};
      result.categories[cat] = {
        revenueAnnuel: k.Revenue50PercentileSum,
        revenueBas: k.Revenue25PercentileSum,
        revenueHaut: k.Revenue75PercentileSum,
        adr: k.ADR50PercentileAvg,
        occupancy: k.AvgAdjustedOccupancy,
        nbListings: k.NoOfListings,
        monthly: mergeMonthly({
          "Revenu médian": mb.Revenue50Percentile,
          "Revenu bas (25%)": mb.Revenue25Percentile,
          "Revenu haut (75%)": mb.Revenue75Percentile,
        }),
        monthlyAdr: mergeMonthly({
          "ADR médian": mb.ADR50Percentile,
          "ADR bas (25%)": mb.ADR25Percentile,
          "ADR haut (75%)": mb.ADR75Percentile,
        }),
        monthlyOcc: mergeMonthly({ Occupation: mb.AvgOccupancy }),
      };
    } else {
      const mb = k.MonthlyBreakup || {};
      result.categories[cat] = {
        revenueAnnuel: k.Revenue,
        revenueBas: null,
        revenueHaut: null,
        adr: k.ADRAvg,
        occupancy: k.AvgOccupancy,
        nbListings: k.NoOfListings,
        monthly: mergeMonthly({ Revenu: mb.Revenue }),
        monthlyAdr: mergeMonthly({ ADR: mb.ADRAvg }),
        monthlyOcc: mergeMonthly({ Occupation: mb.AvgOccupancy }),
      };
    }
  }
  return result;
}

// Fusionne plusieurs séries mensuelles en tableau [{mois, serieA, serieB...}]
function mergeMonthly(series) {
  const byMonth = {};
  for (const [name, obj] of Object.entries(series)) {
    if (!obj) continue;
    for (const { mois, _key, value } of orderMonths(obj)) {
      if (!byMonth[_key]) byMonth[_key] = { mois };
      byMonth[_key][name] = value;
    }
  }
  return MONTH_ORDER.filter((m) => byMonth[m]).map((m) => byMonth[m]);
}
