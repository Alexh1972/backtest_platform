import { SubmissionDto } from "../api/client";
import { getTitle } from "../localStore";

type DraftInfo = { id: string; title: string; createdAt: number };

type Props = {
  drafts: DraftInfo[];
  activeDraftId: string | null;
  submissions: SubmissionDto[];
  focusedHash: string | null;
  compareActive: boolean;
  onSelectDraft: (id: string) => void;
  onDiscardDraft: (id: string) => void;
  onFocus: (hash: string) => void;
  onNew: () => void;
  onCompare: () => void;
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
  compareActive,
  onSelectDraft,
  onDiscardDraft,
  onFocus,
  onNew,
  onCompare,
}: Props) {
  const isEmpty = drafts.length === 0 && submissions.length === 0;

  return (
    <aside className="history">
      <h2>History</h2>
      <div className="history-actions">
        <button className="new-btn" onClick={onNew}>
          + New submission
        </button>
        <button
          className={`compare-btn${compareActive ? " active" : ""}`}
          onClick={onCompare}
          disabled={submissions.length < 2}
          title={
            submissions.length < 2
              ? "Need at least two submissions to compare"
              : "Compare submissions"
          }
        >
          ⇄ Compare
        </button>
      </div>
      <div className="columns">
        <div>Title</div>
        <div>Date</div>
        <div />
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
              <div className="end-cell">
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
              <div className="end-cell" />
            </div>
          );
        })}
      </div>
    </aside>
  );
}
