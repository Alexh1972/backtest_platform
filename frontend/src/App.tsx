import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Landing, { WELCOMED_KEY } from "./pages/Landing";
import { useAuth } from "./auth";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  if (token) return children;
  // Unauthenticated: show the intro once per session, then go straight to login.
  const dest = sessionStorage.getItem(WELCOMED_KEY) ? "/login" : "/welcome";
  return <Navigate to={dest} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
