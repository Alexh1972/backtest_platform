import { ChangeEvent, useRef, useState } from "react";
import { api, ApiError } from "../api/client";

type Props = {
  onSubmitted: (hash: string) => void;
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function NewSubmission({ onSubmitted }: Props) {
  const [code, setCode] = useState("");
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return toIsoDate(d);
  });
  const [end, setEnd] = useState(() => toIsoDate(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCode(text);
  }

  async function submit() {
    setError(null);
    if (!code.trim()) {
      setError("Code is empty.");
      return;
    }
    setLoading(true);
    try {
      const base64 = btoa(unescape(encodeURIComponent(code)));
      const res = await api.submitStrategy({ start, end, code: base64 });
      if (res.status === "ERROR") {
        setError(res.error?.errors?.join(", ") || "Submission failed");
        return;
      }
      const hash = res.message;
      if (hash) onSubmitted(hash);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="main-content">
      {error && <div className="message error">{error}</div>}

      <div className="section">
        <h3>Backtest range</h3>
        <div className="row-flex">
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Start</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>End</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="section" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <h3 style={{ margin: 0 }}>Strategy code</h3>
          <div className="row-flex">
            <input
              type="file"
              ref={fileRef}
              accept=".py,text/x-python,text/plain"
              style={{ display: "none" }}
              onChange={onFile}
            />
            <button onClick={() => fileRef.current?.click()}>Upload file</button>
            <button
              className="primary"
              disabled={loading}
              onClick={submit}
            >
              {loading ? <span className="spinner" /> : "Submit"}
            </button>
          </div>
        </div>
        <textarea
          className="code-area"
          placeholder="# Paste your strategy code here, or upload a .py file"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
