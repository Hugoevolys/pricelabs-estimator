// Données d'exemple (issues de la doc PriceLabs) pour le MODE DÉMO.
// Permet de développer/tester l'interface SANS consommer les 20 appels réels.

export const sampleV2 = {
  version: 2,
  KPIsByBedroomCategory: {
    "2": {
      RevenueMonthlyAvg: 4482,
      Revenue25PercentileSum: 26500,
      Revenue50PercentileSum: 53700,
      Revenue75PercentileSum: 79500,
      Revenue90PercentileSum: 102500,
      ADR90PercentileAvg: 423,
      ADR75PercentileAvg: 343,
      ADR50PercentileAvg: 248,
      ADR25PercentileAvg: 153,
      AvgAdjustedOccupancy: 56,
      NoOfListings: 321,
      MonthlyBreakup: {
        Revenue25Percentile: { January: 1200.5, February: 1400.2, March: 1900.4, April: 1651.1, May: 2100.7, June: 3200.9, July: 4100.3, August: 3843.6, September: 2900.1, October: 2200.8, November: 1500.6, December: 2500.4 },
        Revenue50Percentile: { January: 2800.5, February: 3100.2, March: 3900.4, April: 3730.8, May: 4500.7, June: 6100.9, July: 7200.3, August: 6744.5, September: 5400.1, October: 4200.8, November: 3200.6, December: 4800.4 },
        Revenue75Percentile: { January: 4200.5, February: 4600.2, March: 5800.4, April: 5513.2, May: 6900.7, June: 9200.9, July: 10800.3, August: 10085.1, September: 8100.1, October: 6300.8, November: 4900.6, December: 7100.4 },
        Revenue90Percentile: { January: 5500.5, February: 6000.2, March: 7400.4, April: 6955.3, May: 8700.7, June: 11500.9, July: 13200.3, August: 12213.5, September: 10100.1, October: 7900.8, November: 6200.6, December: 9000.4 },
        ADR25Percentile: { January: 110.5, February: 115.2, March: 128.4, April: 132.5, May: 150.7, June: 180.9, July: 225.3, August: 218.4, September: 175.1, October: 140.8, November: 120.6, December: 160.4 },
        ADR50Percentile: { January: 170.5, February: 178.2, March: 195.4, April: 201.4, May: 230.7, June: 300.9, July: 380.3, August: 368.0, September: 280.1, October: 210.8, November: 185.6, December: 250.4 },
        ADR75Percentile: { January: 230.5, February: 240.2, March: 265.4, April: 275.2, May: 320.7, June: 410.9, July: 490.3, August: 474.4, September: 380.1, October: 285.8, November: 250.6, December: 340.4 },
        ADR90Percentile: { January: 290.5, February: 305.2, March: 335.4, April: 348.1, May: 400.7, June: 510.9, July: 600.3, August: 576.4, September: 470.1, October: 355.8, November: 315.6, December: 420.4 },
        AvgOccupancy: { January: 42.3, February: 45.1, March: 52.4, April: 56.3, May: 60.2, June: 68.5, July: 72.1, August: 66.7, September: 61.4, October: 54.8, November: 47.6, December: 58.9 },
        NoListingUsed: { January: 210, February: 225, March: 240, April: 257, May: 245, June: 230, July: 195, August: 185, September: 220, October: 250, November: 260, December: 240 }
      }
    }
  },
  bedrooms_considered: ["2"]
};

export const sampleV1 = {
  version: 1,
  KPIsByBedroomCategory: {
    "2": {
      ADRAvg: 248,
      ADR25Percentile: 153,
      ADR75Percentile: 343,
      Revenue: 53700,
      AvgOccupancy: 56,
      NoOfListings: 321,
      MonthlyBreakup: {
        Revenue: { January: 2800, February: 3100, March: 3900, April: 3730, May: 4500, June: 6100, July: 7200, August: 6744, September: 5400, October: 4200, November: 3200, December: 4800 },
        ADRAvg: { January: 170, February: 178, March: 195, April: 201, May: 230, June: 300, July: 380, August: 368, September: 280, October: 210, November: 185, December: 250 },
        AvgOccupancy: { January: 42.3, February: 45.1, March: 52.4, April: 56.3, May: 60.2, June: 68.5, July: 72.1, August: 66.7, September: 61.4, October: 54.8, November: 47.6, December: 58.9 },
        NoOfListings: { January: 210, February: 225, March: 240, April: 257, May: 245, June: 230, July: 195, August: 185, September: 220, October: 250, November: 260, December: 240 }
      }
    }
  }
};
