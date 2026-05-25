import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const NAMES = [
  "Ariciu Toma",
  "Cazacu Alexandru",
  "Ghinescu Ștefan",
  "Stănciulescu Ana",
];

// Marks that the intro has played in this tab, so it is not replayed on every
// auth redirect (e.g. after a token expires). A fresh tab plays it again.
export const WELCOMED_KEY = "backtest.welcomed";

// Total time the intro stays before auto-advancing to the login page.
const AUTO_ADVANCE_MS = 4600;
// Must match the .leaving fade-out duration in global.css.
const FADE_OUT_MS = 600;

export default function Landing() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const enter = useCallback(() => {
    setLeaving((already) => {
      if (already) return already;
      sessionStorage.setItem(WELCOMED_KEY, "1");
      window.setTimeout(() => navigate("/login", { replace: true }), FADE_OUT_MS);
      return true;
    });
  }, [navigate]);

  useEffect(() => {
    const t = window.setTimeout(enter, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [enter]);

  return (
    <div
      className={`landing${leaving ? " leaving" : ""}`}
      onClick={enter}
      role="button"
      tabIndex={0}
      aria-label="Enter the application"
    >
      <div className="landing-overlay" />
      <div className="landing-content">
        <h1 className="landing-title">Backtest Platform</h1>
        <p className="landing-sub">A strategy backtesting playground</p>
        <div className="landing-credits">
          {NAMES.map((name, i) => (
            <span key={name} style={{ animationDelay: `${1.3 + i * 0.28}s` }}>
              {name}
            </span>
          ))}
        </div>
        <button
          className="landing-enter"
          onClick={(e) => {
            e.stopPropagation();
            enter();
          }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
