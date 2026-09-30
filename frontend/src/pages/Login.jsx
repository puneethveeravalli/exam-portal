import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        username,
        password,
      });

      const { token, user } = response.data;

      login(token, user);

      if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (user.role === "STUDENT") {
        navigate("/student/dashboard");
      } else {
        navigate("/unauthorized");
      }
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-container">
        <div className="login-card ep-card ep-frame">

          {/* Brand */}

          <div
            className="login-brand ep-reveal"
            style={{ "--i": 0 }}
          >
            <div className="login-brand-mark" aria-hidden="true">
              EP
            </div>

            <div className="login-brand-text">
              <span className="login-brand-name">
                Exam Portal
              </span>

              <span className="login-brand-caption">
                Examination Management System
              </span>
            </div>
          </div>

          {/* Heading */}

          <div
            className="login-heading ep-reveal"
            style={{ "--i": 1 }}
          >
            <h1 className="ep-display login-title">
              Welcome <em>back</em>
            </h1>

            <p>
              Sign in to continue to your examination
              portal.
            </p>
          </div>

          {/* Form */}

          <form
            className="login-form ep-reveal"
            style={{ "--i": 2 }}
            onSubmit={handleLogin}
            noValidate
          >
            <div className="ep-field">
              <label className="ep-label" htmlFor="username">
                Username
              </label>

              <input
                id="username"
                className="ep-input"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Enter your username"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="ep-field">
              <label className="ep-label" htmlFor="password">
                Password
              </label>

              <input
                id="password"
                className="ep-input"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {error && (
              <div
                className="ep-alert ep-alert--danger"
                role="alert"
              >
                <svg
                  className="ep-alert__icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7.5v5.5" />
                  <path d="M12 16.5h.01" />
                </svg>

                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="ep-btn ep-btn--primary ep-btn--block login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="ep-spinner" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Footer */}

          <div
            className="login-footer ep-reveal"
            style={{ "--i": 3 }}
          >
            <span>Authorized access only</span>

            <span className="login-footer-divider" aria-hidden="true"></span>

            <span className="login-footer-status">
              <span className="ep-live-dot" aria-hidden="true"></span>
              Secure examination environment
            </span>
          </div>

        </div>

        <p className="login-copyright ep-caption">
          Exam Portal
        </p>
      </section>
    </main>
  );
}

export default Login;