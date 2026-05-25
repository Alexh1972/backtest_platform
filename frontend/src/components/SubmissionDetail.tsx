import { useEffect, useMemo, useState } from "react";
import {
  api,
  ApiError,
  reportImageUrl,
  reportTradesUrl,
  StrategyReport,
} from "../api/client";
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
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setInfo(null);
    setEditing(false);
    setSelectedRunId(null);
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

  // Default the selection to the most recent run whenever the list changes.
  useEffect(() => {
    if (reports.length === 0) {
      setSelectedRunId(null);
      return;
    }
    setSelectedRunId((cur) =>
      cur != null && reports.some((r) => r.strategyReportId === cur)
        ? cur
        : reports[reports.length - 1].strategyReportId
    );
  }, [reports]);

  const selected = useMemo(
    () => reports.find((r) => r.strategyReportId === selectedRunId) ?? null,
    [reports, selectedRunId]
  );

  // Reset the image error flag when switching runs.
  useEffect(() => {
    setImgError(false);
  }, [selectedRunId]);

  async function refreshReports() {
    setRefreshing(true);
    try {
      const reps = await api.listReports(hash);
      setReports(reps);
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false);
    }
  }

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

  return (
    <div className="main-content">
      {error && <div className="message error">{error}</div>}
      {info && <div className="message ok">{info}</div>}

      <div className="section">
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
              title={editing ? "Submit edited code as a new submission" : "Click Edit code to make a new submission"}
              onClick={resubmit}
            >
              {resubmitting ? <span className="spinner" /> : "Submit"}
            </button>
            <button
              className="primary"
              title="Run this strategy over a period you choose — no new submission needed"
              onClick={() => setRunOpen(true)}
            >
              Run
            </button>
          </div>
        </div>

        {editing ? (
          <textarea
            className="code-area"
            style={{ maxHeight: "42vh" }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <pre className="code-view" style={{ maxHeight: "42vh" }}>{code}</pre>
        )}
      </div>

      <div className="section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <h3 style={{ margin: 0 }}>Runs ({reports.length})</h3>
          <button onClick={refreshReports} disabled={refreshing}>
            {refreshing ? <span className="spinner" /> : "Refresh"}
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="empty" style={{ padding: 16 }}>
            No runs yet. Click <b>Run</b> to start one — you can pick the period
            and tickers each time, without creating a new submission.
          </div>
        ) : (
          <>
            <div className="run-chips">
              {reports.map((r) => (
                <button
                  key={r.strategyReportId}
                  className={`run-chip${
                    r.strategyReportId === selectedRunId ? " active" : ""
                  }`}
                  onClick={() => setSelectedRunId(r.strategyReportId)}
                >
                  #{r.strategyReportId}
                  <span className={`dot ${r.status === "COMPLETED" ? "ok" : "run"}`} />
                </button>
              ))}
            </div>

            {selected && (
              <>
                <div style={{ margin: "10px 0", fontSize: 13, color: "var(--muted)" }}>
                  Run #{selected.strategyReportId} · {selected.status}
                  {selected.tickers && ` · ${selected.tickers}`}
                  {selected.startDate &&
                    ` · ${selected.startDate?.slice(0, 10)} → ${selected.endDate?.slice(0, 10)}`}
                </div>

                <div className="compare-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="cell head">Metric</div>
                  <div className="cell head">Value</div>
                  {METRIC_LABELS.map(([key, label]) => (
                    <div key={key} style={{ display: "contents" }}>
                      <div className="cell metric">{label}</div>
                      <div className="cell">{formatMetric(selected[key])}</div>
                    </div>
                  ))}
                </div>

                <div className="run-artifacts">
                  <div className="artifact-head">
                    <h4>Equity curve</h4>
                    <a
                      className="csv-link"
                      href={reportTradesUrl(selected.strategyReportId)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ⬇ Download trades CSV
                    </a>
                  </div>
                  {imgError ? (
                    <div className="empty" style={{ padding: 24 }}>
                      Equity chart not available yet — it is generated by the
                      worker once the run completes.
                    </div>
                  ) : (
                    <img
                      className="report-image"
                      src={reportImageUrl(selected.strategyReportId)}
                      alt={`Equity curve for run ${selected.strategyReportId}`}
                      onError={() => setImgError(true)}
                    />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {runOpen && (
        <RunModal
          fileHash={hash}
          onClose={() => setRunOpen(false)}
          onStarted={(reportId) => {
            setRunOpen(false);
            setInfo("Run started. Click Refresh in a few seconds to see metrics and the chart.");
            api
              .listReports(hash)
              .then((reps) => {
                setReports(reps);
                setSelectedRunId(reportId);
              })
              .catch(() => undefined);
          }}
        />
      )}
    </div>
  );
}
