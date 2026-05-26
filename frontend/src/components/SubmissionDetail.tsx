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
  onSubmissionsRefresh: () => void | Promise<void>;
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

function sortRuns(reps: StrategyReport[]): StrategyReport[] {
  return [...reps].sort((a, b) => a.strategyReportId - b.strategyReportId);
}

type Csv = { header: string[]; rows: string[][] };

function parseCsv(text: string): Csv | null {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return null;
  return {
    header: lines[0].split(","),
    rows: lines.slice(1).map((l) => l.split(",")),
  };
}

export default function SubmissionDetail({ hash, title, onSubmissionsRefresh }: Props) {
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
  const [trades, setTrades] = useState<Csv | null>(null);
  // Bumped on Refresh to force the chart + trades to reload (cache-busting).
  const [reloadTick, setReloadTick] = useState(0);

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
        setReports(sortRuns(reps));
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

  // Reset the image error flag and (re)load the trades CSV when switching runs.
  useEffect(() => {
    setImgError(false);
    setTrades(null);
    if (selectedRunId == null) return;
    let cancelled = false;
    api
      .getTradesCsv(selectedRunId)
      .then((txt) => {
        if (!cancelled) setTrades(parseCsv(typeof txt === "string" ? txt : ""));
      })
      .catch(() => {
        if (!cancelled) setTrades(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRunId, reloadTick]);

  async function refreshReports() {
    setRefreshing(true);
    try {
      const reps = await api.listReports(hash);
      setReports(sortRuns(reps));
      // Force the chart + trades of the selected run to reload as well.
      setReloadTick((t) => t + 1);
      // Re-sort the History list so this (just-run) submission moves to the top.
      await onSubmissionsRefresh();
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false);
    }
  }

  // Save edits to the existing submission in place (same hash, no new history entry).
  async function saveCode() {
    setError(null);
    setInfo(null);
    if (!draft.trim()) {
      setError("Code is empty.");
      return;
    }
    setResubmitting(true);
    try {
      const base64 = btoa(unescape(encodeURIComponent(draft)));
      const res = await api.updateSubmissionCode(hash, base64);
      if (res.status === "ERROR") {
        setError(res.error?.errors?.join(", ") || "Update failed");
        return;
      }
      setCode(draft);
      setEditing(false);
      setInfo("Code updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
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
              title={editing ? "Save changes to this submission" : "Click Edit code to change this submission"}
              onClick={saveCode}
            >
              {resubmitting ? <span className="spinner" /> : "Save"}
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

                {/* 1. Metrics */}
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

                {/* 2. Equity curve */}
                <div className="run-artifacts">
                  <h4 className="artifact-title">Equity curve</h4>
                  {imgError ? (
                    <div className="empty" style={{ padding: 24 }}>
                      Equity chart not available yet — it is generated by the
                      worker once the run completes.
                    </div>
                  ) : (
                    <img
                      className="report-image"
                      src={`${reportImageUrl(selected.strategyReportId)}&r=${reloadTick}`}
                      alt={`Equity curve for run ${selected.strategyReportId}`}
                      onError={() => setImgError(true)}
                    />
                  )}
                </div>

                {/* 3. Trades */}
                <div className="run-artifacts">
                  <div className="artifact-head">
                    <h4>Trades</h4>
                    <a
                      className="csv-link"
                      href={reportTradesUrl(selected.strategyReportId)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ⬇ Download CSV
                    </a>
                  </div>
                  {trades ? (
                    <div className="trades-wrap">
                      <table className="trades-table">
                        <thead>
                          <tr>
                            {trades.header.map((h, i) => (
                              <th key={i}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {trades.rows.map((row, ri) => (
                            <tr key={ri}>
                              {row.map((cell, ci) => (
                                <td key={ci}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty" style={{ padding: 24 }}>
                      No trades to show yet — available once the run completes.
                    </div>
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
                setReports(sortRuns(reps));
                setSelectedRunId(reportId);
              })
              .catch(() => undefined);
          }}
        />
      )}
    </div>
  );
}
