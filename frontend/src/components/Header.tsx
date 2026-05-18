import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

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

export default function Header({ username }: { username?: string | null }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
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
            {username && <div className="username">{username}</div>}
            <div
              className="item"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              Sign out
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
