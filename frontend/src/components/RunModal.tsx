import { useState } from "react";
import { api, ApiError } from "../api/client";

type Props = {
  fileHash: string;
  onClose: () => void;
  onStarted: (reportId: number) => void;
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function RunModal({ fileHash, onClose, onStarted }: Props) {
  const [tickers, setTickers] = useState("AAPL,MSFT");
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return toIsoDate(d);
  });
  const [end, setEnd] = useState(() => toIsoDate(new Date()));
  const [capital, setCapital] = useState("10000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    const tickerList = tickers
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tickerList.length === 0) {
      setError("Add at least one ticker.");
      return;
    }
    const cap = Number(capital);
    if (!isFinite(cap) || cap <= 0) {
      setError("Capital must be a positive number.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.runStrategy({
        tickers: tickerList,
        start,
        end,
        file: fileHash,
        capital: cap,
      });
      if (res.status === "ERROR" || !res.id) {
        setError(res.error?.errors?.join(", ") || "Failed to start run");
        return;
      }
      onStarted(res.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start run");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 440,
          background: "white",
          borderRadius: 12,
          padding: 22,
          boxShadow: "0 12px 38px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Run strategy</h3>
        {error && <div className="message error">{error}</div>}

        <div className="form-row">
          <label>Tickers</label>
          <input
            value={tickers}
            onChange={(e) => setTickers(e.target.value)}
            placeholder="AAPL,MSFT,GOOG"
          />
        </div>
        <div className="form-row">
          <label>Start</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>End</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>Capital</label>
          <input
            type="number"
            min="0"
            step="100"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <button onClick={onClose}>Cancel</button>
          <button className="primary" disabled={loading} onClick={run}>
            {loading ? <span className="spinner" /> : "Run"}
          </button>
        </div>
      </div>
    </div>
  );
}
