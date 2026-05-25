import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import History, { resolveTitle } from "../components/History";
import NewSubmission from "../components/NewSubmission";
import SubmissionDetail from "../components/SubmissionDetail";
import Compare from "../components/Compare";
import { api, ApiError, SubmissionDto } from "../api/client";
import { setTitle } from "../localStore";
import { useAuth } from "../auth";
import { useNavigate } from "react-router-dom";

const DEFAULT_TITLE = "submission.py";

const STRATEGY_TEMPLATE = `class Strategy:
    def __init__(self, trading_context):
        self.__trading_context = trading_context

    def onCandle(self, candle):
        pass
`;

type Draft = {
  id: string;
  title: string;
  code: string;
  start: string;
  end: string;
  createdAt: number;
};

type View =
  | { kind: "empty" }
  | { kind: "draft"; id: string }
  | { kind: "detail"; hash: string }
  | { kind: "compare"; hashes: [string, string] };

function parseJwtUsername(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const obj = JSON.parse(json) as { sub?: string };
    return obj.sub ?? null;
  } catch {
    return null;
  }
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function makeDraft(): Draft {
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  return {
    id: `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    title: DEFAULT_TITLE,
    code: STRATEGY_TEMPLATE,
    start: toIsoDate(start),
    end: toIsoDate(new Date()),
    createdAt: Date.now(),
  };
}

export default function Home() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const username = useMemo(() => parseJwtUsername(token), [token]);

  // Start empty: no draft until the user clicks "+ New submission".
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [view, setView] = useState<View>({ kind: "empty" });
  const [compareHashes, setCompareHashes] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await api.listSubmissions();
      setSubmissions(list);
      setLoadError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      setLoadError(err instanceof ApiError ? err.message : "Failed to load submissions");
    }
  }, [logout, navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const titleFor = useCallback(
    (hash: string): string => {
      const idx = submissions.findIndex((s) => s.hash === hash);
      return idx >= 0 ? resolveTitle(hash, idx) : hash.slice(0, 8);
    },
    [submissions]
  );

  // Add a fresh draft on top of the list; previous drafts stay and move down.
  function startNew() {
    const d = makeDraft();
    setDrafts((prev) => [d, ...prev]);
    setView({ kind: "draft", id: d.id });
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function discardDraft(id: string) {
    const remaining = drafts.filter((d) => d.id !== id);
    const wasActive = view.kind === "draft" && view.id === id;
    setDrafts(remaining);
    if (wasActive) {
      setView(
        remaining.length > 0
          ? { kind: "draft", id: remaining[0].id }
          : { kind: "empty" }
      );
    }
  }

  function toggleCompare(hash: string) {
    setCompareHashes((prev) => {
      if (prev.includes(hash)) return prev.filter((h) => h !== hash);
      if (prev.length >= 2) return [prev[1], hash];
      return [...prev, hash];
    });
  }

  function startCompare() {
    if (compareHashes.length === 2) {
      setView({ kind: "compare", hashes: [compareHashes[0], compareHashes[1]] });
    }
  }

  const activeDraft =
    view.kind === "draft" ? drafts.find((d) => d.id === view.id) ?? null : null;

  return (
    <div className="app">
      <Header username={username} />
      <div className="body">
        <History
          drafts={drafts.map((d) => ({ id: d.id, title: d.title, createdAt: d.createdAt }))}
          activeDraftId={view.kind === "draft" ? view.id : null}
          submissions={submissions}
          focusedHash={view.kind === "detail" ? view.hash : null}
          compareHashes={compareHashes}
          onSelectDraft={(id) => setView({ kind: "draft", id })}
          onDiscardDraft={discardDraft}
          onFocus={(h) => setView({ kind: "detail", hash: h })}
          onToggleCompare={toggleCompare}
          onNew={startNew}
          onCompare={startCompare}
          onClearCompare={() => setCompareHashes([])}
        />
        <main className="main">
          <div className="main-toolbar">
            <div className="title">
              {view.kind === "draft" &&
                activeDraft &&
                (activeDraft.title.trim() || DEFAULT_TITLE)}
              {view.kind === "detail" && titleFor(view.hash)}
              {view.kind === "compare" &&
                `Compare: ${titleFor(view.hashes[0])} vs ${titleFor(view.hashes[1])}`}
            </div>
          </div>
          {loadError && (
            <div style={{ padding: "12px 24px 0" }}>
              <div className="message error">{loadError}</div>
            </div>
          )}
          {(view.kind === "empty" ||
            (view.kind === "draft" && !activeDraft)) && (
            <div className="main-content">
              <div className="empty">
                Nothing open. Click “+ New submission” to start, or pick one
                from the history.
              </div>
            </div>
          )}
          {view.kind === "draft" && activeDraft && (
            <NewSubmission
              key={activeDraft.id}
              title={activeDraft.title}
              code={activeDraft.code}
              start={activeDraft.start}
              end={activeDraft.end}
              onChange={(patch) => updateDraft(activeDraft.id, patch)}
              onSubmitted={async (hash, title) => {
                setTitle(hash, title);
                setDrafts((prev) => prev.filter((d) => d.id !== activeDraft.id));
                await refresh();
                setView({ kind: "detail", hash });
              }}
            />
          )}
          {view.kind === "detail" && (
            <SubmissionDetail
              key={view.hash}
              hash={view.hash}
              title={titleFor(view.hash)}
              onResubmitted={async (newHash) => {
                await refresh();
                setView({ kind: "detail", hash: newHash });
              }}
            />
          )}
          {view.kind === "compare" && (
            <Compare
              hashes={view.hashes}
              titles={[titleFor(view.hashes[0]), titleFor(view.hashes[1])]}
            />
          )}
        </main>
      </div>
    </div>
  );
}
