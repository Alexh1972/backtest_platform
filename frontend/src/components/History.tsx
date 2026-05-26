import { useEffect, useState } from "react";
import { SubmissionDto } from "../api/client";

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
  onDelete: (hash: string) => void;
};

type CtxMenu = { x: number; y: number; hash: string; name: string };

function formatDate(ts: number | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
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
  onDelete,
}: Props) {
  const isEmpty = drafts.length === 0 && submissions.length === 0;
  const [menu, setMenu] = useState<CtxMenu | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const close = () => {
      setMenu(null);
      setConfirming(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  function openMenu(e: React.MouseEvent, hash: string, name: string) {
    e.preventDefault();
    setConfirming(false);
    setMenu({ x: e.clientX, y: e.clientY, hash, name });
  }

  function closeMenu() {
    setMenu(null);
    setConfirming(false);
  }

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
          const name = s.name || `submission ${idx + 1}`;
          return (
            <div
              key={s.hash}
              className={`row${active ? " active" : ""}`}
              onClick={() => onFocus(s.hash)}
              onContextMenu={(e) => openMenu(e, s.hash, name)}
              title={s.hash}
            >
              <div>{name}</div>
              <div>{formatDate(s.createdAt)}</div>
              <div className="end-cell" />
            </div>
          );
        })}
      </div>

      {menu && (
        <div
          className="context-menu"
          style={{ top: menu.y, left: menu.x }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {!confirming ? (
            <button
              className="ctx-item danger"
              onClick={() => setConfirming(true)}
            >
              🗑 Delete submission
            </button>
          ) : (
            <>
              <div className="ctx-label">Delete “{menu.name}”?</div>
              <button
                className="ctx-item danger"
                onClick={() => {
                  onDelete(menu.hash);
                  closeMenu();
                }}
              >
                Yes, delete
              </button>
              <button className="ctx-item" onClick={closeMenu}>
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
