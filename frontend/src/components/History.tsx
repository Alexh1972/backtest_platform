import { SubmissionDto } from "../api/client";

type Props = {
  submissions: SubmissionDto[];
  focusedHash: string | null;
  compareHashes: string[];
  onFocus: (hash: string) => void;
  onToggleCompare: (hash: string) => void;
  onNew: () => void;
  onCompare: () => void;
  onClearCompare: () => void;
};

function formatDate(ts: number | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export function shortTitle(hash: string, idx: number): string {
  return `submit${idx + 1}`;
}

export default function History({
  submissions,
  focusedHash,
  compareHashes,
  onFocus,
  onToggleCompare,
  onNew,
  onCompare,
  onClearCompare,
}: Props) {
  return (
    <aside className="history">
      <h2>History</h2>
      <button className="new-btn" onClick={onNew}>
        + New submission
      </button>
      <div className="columns">
        <div>Title</div>
        <div>Date</div>
        <div style={{ textAlign: "center" }}>Compare</div>
      </div>
      <div className="rows">
        {submissions.length === 0 && (
          <div className="empty">No submissions yet</div>
        )}
        {submissions.map((s, idx) => {
          const checked = compareHashes.includes(s.hash);
          const active = focusedHash === s.hash;
          return (
            <div
              key={s.hash}
              className={`row${active ? " active" : ""}`}
              onClick={() => onFocus(s.hash)}
              title={s.hash}
            >
              <div>{shortTitle(s.hash, idx)}</div>
              <div>{formatDate(s.createdAt)}</div>
              <div
                className="compare"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(s.hash);
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  aria-label="Compare"
                />
              </div>
            </div>
          );
        })}
      </div>
      {compareHashes.length > 0 && (
        <div className="compare-bar">
          <span>{compareHashes.length} selected</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onClearCompare}>Clear</button>
            <button
              className="primary"
              disabled={compareHashes.length !== 2}
              onClick={onCompare}
            >
              Compare
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
