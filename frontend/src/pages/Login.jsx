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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="login-page">
      <a className="login-skip" href="#main-content">
        Skip to main content
      </a>

      <main className="login-main" id="main-content" tabIndex={-1}>
        <div className="login-shell">
          {/* LEFT BRAND PANEL */}
          <section className="login-brand-panel">
            <div className="login-brand-top">
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

            <div className="login-brand-content">
              <span className="login-brand-eyebrow">
                SECURE EXAMINATION PLATFORM
              </span>

              <h1>
                Manage examinations.
                <br />
                Conduct assessments.
                <br />
                Track results.
              </h1>

              <p>
                A centralized platform for managing hiring drives,
                examinations, candidates, question banks and assessment
                results.
              </p>
            </div>

            <div className="login-brand-footer">
              <span className="login-security-dot" />
              Authorized users only
            </div>
          </section>

          {/* LOGIN CARD */}
          <section className="login-card">
            <div className="login-card-header">
              <span className="login-section-label">
                ACCOUNT ACCESS
              </span>

              <h2>Sign in</h2>

              <p>
                Enter your credentials to access the examination
                platform.
              </p>
            </div>

            <form
              className="login-form"
              onSubmit={handleLogin}
              noValidate
              aria-label="Sign in"
            >
              <div className="login-field">
                <label htmlFor="username">
                  Username
                </label>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  autoComplete="username"
                  disabled={loading}
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    error ? "login-error" : undefined
                  }
                  placeholder="Enter your username"
                />
              </div>

              <div className="login-field">
                <label htmlFor="password">
                  Password
                </label>

                <div className="login-password">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete="current-password"
                    disabled={loading}
                    aria-invalid={Boolean(error)}
                    aria-describedby={
                      error ? "login-error" : undefined
                    }
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    className="login-eye"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    aria-pressed={showPassword}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c5 0 8.5 4 9.5 6a12.7 12.7 0 0 1-2.6 3.3" />
                        <path d="M6.6 7.7A12.7 12.7 0 0 0 2.5 12c1 2 4.5 6 9.5 6 1.4 0 2.7-.3 3.8-.8" />
                        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="login-error"
                  id="login-error"
                  role="alert"
                >
                  <span className="login-error-icon">
                    !
                  </span>

                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="login-spinner"
                      aria-hidden="true"
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <span className="login-submit-arrow">
                      →
                    </span>
                  </>
                )}
              </button>

              <span
                className="login-sr-only"
                role="status"
              >
                {loading
                  ? "Signing in, please wait."
                  : ""}
              </span>
            </form>

            <div className="login-card-footer">
              <span>Exam Portal</span>
              <span className="login-footer-separator">
                •
              </span>
              <span>Authorized access only</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Login;