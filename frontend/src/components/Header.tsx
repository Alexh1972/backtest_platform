import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { useAuth } from "../auth";
import { useTheme } from "../theme";

function ShareIcon() {
  return (
    <svg
      className="share-icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <line x1="8.1" y1="11" x2="15.9" y2="7" />
      <line x1="8.1" y1="13" x2="15.9" y2="17" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-3.9 0-7.5 2-7.5 5v1.5h15V19c0-3-3.6-5-7.5-5Z" />
    </svg>
  );
}

type Dialog = "username" | "password" | null;

export default function Header({ username }: { username?: string | null }) {
  const { logout, setToken } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Load the real email (the JWT only carries the username).
  useEffect(() => {
    let cancelled = false;
    api
      .getProfile()
      .then((p) => {
        if (!cancelled && p.status !== "ERROR") setEmail(p.email ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [username]);

  return (
    <header className="header">
      <div className="left">
        <span className="share-icon">
          <ShareIcon />
        </span>
        <span className="title">Backtest platform</span>
      </div>
      <div className="user-menu" ref={menuRef}>
        <div
          className="icon"
          onClick={() => setOpen((o) => !o)}
          aria-label="User menu"
        >
          <UserIcon />
        </div>
        {open && (
          <div className="user-dropdown">
            <div className="ud-id">
              <div className="ud-avatar">
                <UserIcon />
              </div>
              <div className="ud-info">
                <div className="ud-name">{username ?? "User"}</div>
                <div className="ud-email">{email ?? "—"}</div>
              </div>
            </div>

            <div className="ud-section">
              <button className="ud-action" onClick={() => setDialog("password")}>
                Change password
              </button>
              <button className="ud-action" onClick={() => setDialog("username")}>
                Change username
              </button>
            </div>

            <div className="ud-section">
              <div className="ud-label">Display</div>
              <div className="ud-toggle">
                <button
                  className={theme === "light" ? "active" : ""}
                  onClick={() => setTheme("light")}
                >
                  ☀ Light
                </button>
                <button
                  className={theme === "dark" ? "active" : ""}
                  onClick={() => setTheme("dark")}
                >
                  ☾ Dark
                </button>
              </div>
            </div>

            <div className="ud-section">
              <div
                className="ud-signout"
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                Sign out
              </div>
            </div>
          </div>
        )}
      </div>

      {dialog === "username" && (
        <ChangeUsernameDialog
          onClose={() => setDialog(null)}
          onChanged={(newToken) => {
            setToken(newToken);
            setDialog(null);
          }}
        />
      )}
      {dialog === "password" && (
        <ChangePasswordDialog onClose={() => setDialog(null)} />
      )}
    </header>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ChangeUsernameDialog({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged: (newToken: string) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!value.trim()) {
      setError("Username cannot be empty.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.updateUsername(value.trim());
      if (res.status === "ERROR" || !res.token) {
        setError(res.error?.errors?.join(", ") || "Failed to change username");
        return;
      }
      onChanged(res.token);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to change username");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Change username" onClose={onClose}>
      {error && <div className="message error">{error}</div>}
      <div className="form-row">
        <label>New username</label>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
      <div className="modal-actions">
        <button onClick={onClose}>Cancel</button>
        <button className="primary" disabled={loading} onClick={submit}>
          {loading ? <span className="spinner" /> : "Save"}
        </button>
      </div>
    </Modal>
  );
}

function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!current || !next) {
      setError("Both fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.updatePassword(current, next);
      if (res.status === "ERROR") {
        setError(res.error?.errors?.join(", ") || "Failed to change password");
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Change password" onClose={onClose}>
      {error && <div className="message error">{error}</div>}
      {done ? (
        <>
          <div className="message ok">Password updated successfully.</div>
          <div className="modal-actions">
            <button className="primary" onClick={onClose}>
              Done
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="form-row">
            <label>Current</label>
            <input
              type="password"
              autoFocus
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>New</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div className="modal-actions">
            <button onClick={onClose}>Cancel</button>
            <button className="primary" disabled={loading} onClick={submit}>
              {loading ? <span className="spinner" /> : "Save"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
