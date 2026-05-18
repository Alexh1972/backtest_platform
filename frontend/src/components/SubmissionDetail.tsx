import { useEffect, useState } from "react";
import { api, ApiError, StrategyReport } from "../api/client";
import RunModal from "./RunModal";

type Props = {
  hash: string;
  title: string;
  onResubmitted: (newHash: string) => void;
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

export default function SubmissionDetail({ hash, title, onResubmitted }: Props) {
  const [code, setCode] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>("");
  const [reports, setReports] = useState<StrategyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setInfo(null);
    setEditing(false);
    Promise.all([api.getSubmissionCode(hash), api.listReports(hash)])
      .then(([codeRes, reps]) => {
        if (cancelled) return;
        if (codeRes.status === "ERROR") {
          setError(codeRes.error?.errors?.join(", ") || "Failed to load code");
        } else {
          setCode(codeRes.message || "");
          setDraft(codeRes.message || "");
        }
        setReports(reps);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load submission");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hash]);

  async function resubmit() {
    setError(null);
    setInfo(null);
    if (!draft.trim()) {
      setError("Code is empty.");
      return;
    }
    setResubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      const startStr = start.toISOString().slice(0, 10);
      const base64 = btoa(unescape(encodeURIComponent(draft)));
      const res = await api.submitStrategy({ start: startStr, end: today, code: base64 });
      if (res.status === "ERROR") {
        setError(res.error?.errors?.join(", ") || "Submission failed");
        return;
      }
      const newHash = res.message;
      if (newHash) {
        setInfo("New submission created.");
        onResubmitted(newHash);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Submission failed");
    } finally {
      setResubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="main-content">
        <div className="empty">
          <span className="spinner" /> Loading…
        </div>
      </div>
    );
  }

  const latest = reports.length > 0 ? reports[reports.length - 1] : null;

  return (
    <div className="main-content">
      {error && <div className="message error">{error}</div>}
      {info && <div className="message ok">{info}</div>}

      <div className="section" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <h3 style={{ margin: 0 }}>
            {title} · code{" "}
            <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 12 }}>
              {hash.slice(0, 8)}
            </span>
          </h3>
          <div className="row-flex">
            {!editing ? (
              <button onClick={() => setEditing(true)}>Edit code</button>
            ) : (
              <button onClick={() => { setEditing(false); setDraft(code); }}>
                Cancel edit
              </button>
            )}
            <button
              className="primary"
              disabled={resubmitting || !editing}
              title={editing ? "Submit edited code as new submission" : "Click Edit code to make a new submission"}
              onClick={resubmit}
            >
              {resubmitting ? <span className="spinner" /> : "Submit"}
            </button>
            <button className="primary" onClick={() => setRunOpen(true)}>
              Run
            </button>
          </div>
        </div>

        {editing ? (
          <textarea
            className="code-area"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <pre className="code-view">{code}</pre>
        )}
      </div>

      <div className="section">
        <h3>Runs ({reports.length})</h3>
        {reports.length === 0 ? (
          <div className="empty" style={{ padding: 16 }}>
            No runs yet. Click Run to start one.
          </div>
        ) : (
          <div>
            {latest && (
              <div style={{ marginBottom: 8, fontSize: 13, color: "var(--muted)" }}>
                Latest run #{latest.strategyReportId} · {latest.status}
                {latest.tickers && ` · ${latest.tickers}`}
              </div>
            )}
            <div className="compare-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="cell head">Metric</div>
              <div className="cell head">Latest run</div>
              {METRIC_LABELS.map(([key, label]) => (
                <div key={key} style={{ display: "contents" }}>
                  <div className="cell metric">{label}</div>
                  <div className="cell">
                    {latest ? formatMetric(latest[key]) : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {runOpen && (
        <RunModal
          fileHash={hash}
          onClose={() => setRunOpen(false)}
          onStarted={() => {
            setRunOpen(false);
            setInfo("Run started. Reload in a few seconds to see metrics.");
            api
              .listReports(hash)
              .then((reps) => setReports(reps))
              .catch(() => undefined);
          }}
        />
      )}
    </div>
  );
}
