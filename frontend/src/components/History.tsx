import { SubmissionDto } from "../api/client";
import { getTitle } from "../localStore";

type DraftInfo = { id: string; title: string; createdAt: number };

type Props = {
  drafts: DraftInfo[];
  activeDraftId: string | null;
  submissions: SubmissionDto[];
  focusedHash: string | null;
  compareHashes: string[];
  onSelectDraft: (id: string) => void;
  onDiscardDraft: (id: string) => void;
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

// Prefer the user-chosen title (kept in localStorage); fall back to submitN.
export function resolveTitle(hash: string, idx: number): string {
  return getTitle(hash) ?? shortTitle(hash, idx);
}

export default function History({
  drafts,
  activeDraftId,
  submissions,
  focusedHash,
  compareHashes,
  onSelectDraft,
  onDiscardDraft,
  onFocus,
  onToggleCompare,
  onNew,
  onCompare,
  onClearCompare,
}: Props) {
  const isEmpty = drafts.length === 0 && submissions.length === 0;

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
        {isEmpty && <div className="empty">No submissions yet</div>}

        {drafts.map((d) => {
          const active = activeDraftId === d.id;
          return (
            <div
              key={d.id}
              className={`row draft${active ? " active" : ""}`}
              onClick={() => onSelectDraft(d.id)}
              title="Unsaved submission"
            >
              <div>{d.title.trim() || "submission.py"}</div>
              <div>{formatDate(d.createdAt)}</div>
              <div className="compare">
                <button
                  className="discard"
                  title="Discard draft"
                  aria-label="Discard draft"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDiscardDraft(d.id);
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}

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
              <div>{resolveTitle(s.hash, idx)}</div>
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
