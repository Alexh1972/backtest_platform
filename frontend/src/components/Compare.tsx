import { useEffect, useState } from "react";
import { api, ApiError, StrategyReport } from "../api/client";

type Props = {
  hashes: [string, string];
  titles: [string, string];
};

const METRIC_LABELS: Array<[keyof StrategyReport, string]> = [
  ["fullReturn", "Full return"],
  ["annualizedReturn", "Annualized return"],
  ["dailyReturn", "Daily return"],
  ["annualRisk", "Annual risk"],
  ["dailyRisk", "Daily risk"],
  ["sharpeRatio", "Sharpe ratio"],
  ["sortinoRatio", "Sortino ratio"],
  ["maxDrawdown", "Max drawdown"],
  ["calmarRatio", "Calmar ratio"],
  ["beta", "Beta"],
  ["alpha", "Alpha"],
  ["var95", "VaR 95"],
  ["skewness", "Skewness"],
  ["kurtosis", "Kurtosis"],
];

function formatMetric(v: unknown): string {
  if (typeof v !== "number") return "—";
  if (!isFinite(v)) return "—";
  return v.toFixed(4);
}

function latestReport(reports: StrategyReport[]): StrategyReport | null {
  if (reports.length === 0) return null;
  return reports.reduce((acc, r) => (r.lastUpdated > acc.lastUpdated ? r : acc), reports[0]);
}

export default function Compare({ hashes, titles }: Props) {
  const [leftReports, setLeftReports] = useState<StrategyReport[]>([]);
  const [rightReports, setRightReports] = useState<StrategyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([api.listReports(hashes[0]), api.listReports(hashes[1])])
      .then(([a, b]) => {
        if (cancelled) return;
        setLeftReports(a);
        setRightReports(b);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load reports");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hashes[0], hashes[1]]);

  if (loading) {
    return (
      <div className="main-content">
        <div className="empty">
          <span className="spinner" /> Loading…
        </div>
      </div>
    );
  }

  const left = latestReport(leftReports);
  const right = latestReport(rightReports);

  return (
    <div className="main-content">
      {error && <div className="message error">{error}</div>}

      {!left && !right && (
        <div className="message error">
          Neither submission has any runs to compare yet.
        </div>
      )}

      <div className="compare-grid">
        <div className="cell head">Metric</div>
        <div className="cell head">{titles[0]}</div>
        <div className="cell head">{titles[1]}</div>
        <div className="cell metric">Status</div>
        <div className="cell">{left?.status ?? "—"}</div>
        <div className="cell">{right?.status ?? "—"}</div>
        <div className="cell metric">Tickers</div>
        <div className="cell">{left?.tickers || "—"}</div>
        <div className="cell">{right?.tickers || "—"}</div>
        {METRIC_LABELS.map(([key, label]) => (
          <div key={key} style={{ display: "contents" }}>
            <div className="cell metric">{label}</div>
            <div className="cell">{formatMetric(left?.[key])}</div>
            <div className="cell">{formatMetric(right?.[key])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
