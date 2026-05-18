import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import History, { shortTitle } from "../components/History";
import NewSubmission from "../components/NewSubmission";
import SubmissionDetail from "../components/SubmissionDetail";
import Compare from "../components/Compare";
import { api, ApiError, SubmissionDto } from "../api/client";
import { useAuth } from "../auth";
import { useNavigate } from "react-router-dom";

type View =
  | { kind: "new" }
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

export default function Home() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const username = useMemo(() => parseJwtUsername(token), [token]);

  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [view, setView] = useState<View>({ kind: "new" });
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
      return idx >= 0 ? shortTitle(hash, idx) : hash.slice(0, 8);
    },
    [submissions]
  );

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

  return (
    <div className="app">
      <Header username={username} />
      <div className="body">
        <History
          submissions={submissions}
          focusedHash={view.kind === "detail" ? view.hash : null}
          compareHashes={compareHashes}
          onFocus={(h) => setView({ kind: "detail", hash: h })}
          onToggleCompare={toggleCompare}
          onNew={() => setView({ kind: "new" })}
          onCompare={startCompare}
          onClearCompare={() => setCompareHashes([])}
        />
        <main className="main">
          <div className="main-toolbar">
            <div className="title">
              {view.kind === "new" && "New submission"}
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
          {view.kind === "new" && (
            <NewSubmission
              onSubmitted={async (hash) => {
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
