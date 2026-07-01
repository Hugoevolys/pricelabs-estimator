import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";

const COLORS = ["#00286e", "#5b7bc4", "#1e40af", "#f59e0b", "#10b981"];

function Chart({ title, data, keys, type = "line" }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="card chart">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        {type === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="mois" />
            <YAxis />
            <Tooltip />
            <Legend />
            {keys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} />
            ))}
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="mois" />
            <YAxis />
            <Tooltip />
            <Legend />
            {keys.map((k, i) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={k.includes("médian") || k === "Revenu" || k === "ADR" ? 3 : 1.5}
                dot={false}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default function MonthlyCharts({ cat }) {
  const revKeys = cat.monthly[0] ? Object.keys(cat.monthly[0]).filter((k) => k !== "mois") : [];
  const adrKeys = cat.monthlyAdr[0] ? Object.keys(cat.monthlyAdr[0]).filter((k) => k !== "mois") : [];

  return (
    <div className="charts">
      <Chart title="Revenus par mois" data={cat.monthly} keys={revKeys} type="bar" />
      <Chart title="ADR (tarif moyen/nuit) par mois" data={cat.monthlyAdr} keys={adrKeys} />
      <Chart title="Taux d'occupation par mois (%)" data={cat.monthlyOcc} keys={["Occupation"]} />
    </div>
  );
}
