import { useEffect, useState } from "react";
import { api, reportImageUrl, StrategyReport, SubmissionDto } from "../api/client";

type Props = {
  submissions: SubmissionDto[];
  titleFor: (hash: string) => string;
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

function runLabel(r: StrategyReport): string {
  const t = r.tickers ? ` · ${r.tickers}` : "";
  return `#${r.strategyReportId} · ${r.status}${t}`;
}

// Loads the runs for a submission hash and tracks the selected run.
function useSide(hash: string) {
  const [runs, setRuns] = useState<StrategyReport[]>([]);
  const [runId, setRunId] = useState<number | null>(null);

  useEffect(() => {
    if (!hash) {
      setRuns([]);
      setRunId(null);
      return;
    }
    let cancelled = false;
    api
      .listReports(hash)
      .then((r) => {
        if (cancelled) return;
        setRuns(r);
        setRunId(r.length ? r[r.length - 1].strategyReportId : null);
      })
      .catch(() => {
        if (!cancelled) {
          setRuns([]);
          setRunId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [hash]);

  const run = runs.find((r) => r.strategyReportId === runId) ?? null;
  return { runs, runId, setRunId, run };
}

function SideControls({
  label,
  hash,
  onHash,
  side,
  submissions,
  titleFor,
}: {
  label: string;
  hash: string;
  onHash: (h: string) => void;
  side: ReturnType<typeof useSide>;
  submissions: SubmissionDto[];
  titleFor: (hash: string) => string;
}) {
  return (
    <div className="compare-side">
      <div className="form-row" style={{ marginBottom: 8 }}>
        <label>{label}</label>
        <select value={hash} onChange={(e) => onHash(e.target.value)}>
          {submissions.map((s) => (
            <option key={s.hash} value={s.hash}>
              {titleFor(s.hash)}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row" style={{ marginBottom: 0 }}>
        <label>Run</label>
        <select
          value={side.runId ?? ""}
          onChange={(e) => side.setRunId(Number(e.target.value))}
          disabled={side.runs.length === 0}
        >
          {side.runs.length === 0 && <option value="">No runs</option>}
          {side.runs.map((r) => (
            <option key={r.strategyReportId} value={r.strategyReportId}>
              {runLabel(r)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Graph({
  title,
  run,
}: {
  title: string;
  run: StrategyReport | null;
}) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [run?.strategyReportId]);

  return (
    <div className="compare-graph">
      <div className="graph-title">{title}</div>
      {run && !imgError ? (
        <img
          className="report-image"
          src={reportImageUrl(run.strategyReportId)}
          alt={title}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="empty" style={{ padding: 24 }}>
          {run ? "Chart not available yet." : "No run selected."}
        </div>
      )}
    </div>
  );
}

export default function Compare({ submissions, titleFor }: Props) {
  const [hashA, setHashA] = useState<string>(submissions[0]?.hash ?? "");
  const [hashB, setHashB] = useState<string>(
    submissions[1]?.hash ?? submissions[0]?.hash ?? ""
  );

  const a = useSide(hashA);
  const b = useSide(hashB);

  if (submissions.length < 2) {
    return (
      <div className="main-content">
        <div className="empty">Need at least two submissions to compare.</div>
      </div>
    );
  }

  const titleA = `${titleFor(hashA)}${a.run ? ` · #${a.run.strategyReportId}` : ""}`;
  const titleB = `${titleFor(hashB)}${b.run ? ` · #${b.run.strategyReportId}` : ""}`;

  return (
    <div className="main-content">
      <div className="section">
        <div className="compare-controls">
          <SideControls
            label="Submission A"
            hash={hashA}
            onHash={setHashA}
            side={a}
            submissions={submissions}
            titleFor={titleFor}
          />
          <SideControls
            label="Submission B"
            hash={hashB}
            onHash={setHashB}
            side={b}
            submissions={submissions}
            titleFor={titleFor}
          />
        </div>
      </div>

      {/* Graphs first, side by side */}
      <div className="compare-graphs">
        <Graph title={titleA} run={a.run} />
        <Graph title={titleB} run={b.run} />
      </div>

      {/* Metrics table below */}
      <div className="section">
        <div className="compare-grid">
          <div className="cell head">Metric</div>
          <div className="cell head">{titleA}</div>
          <div className="cell head">{titleB}</div>
          <div className="cell metric">Status</div>
          <div className="cell">{a.run?.status ?? "—"}</div>
          <div className="cell">{b.run?.status ?? "—"}</div>
          <div className="cell metric">Tickers</div>
          <div className="cell">{a.run?.tickers || "—"}</div>
          <div className="cell">{b.run?.tickers || "—"}</div>
          {METRIC_LABELS.map(([key, label]) => (
            <div key={key} style={{ display: "contents" }}>
              <div className="cell metric">{label}</div>
              <div className="cell">{formatMetric(a.run?.[key])}</div>
              <div className="cell">{formatMetric(b.run?.[key])}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
