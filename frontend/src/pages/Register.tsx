import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { useAuth } from "../auth";

export default function Register() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.signup({ username, password, email });
      setToken(res.token);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Sign-up failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Create account</h1>
        <p className="sub">Get started with the backtest platform.</p>

        {error && <div className="message error">{error}</div>}

        <label>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          required
        />

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="actions">
          <Link to="/login">Have an account?</Link>
          <button type="submit" className="primary" disabled={loading}>
            {loading ? <span className="spinner" /> : "Sign up"}
          </button>
        </div>
      </form>
    </div>
  );
}
