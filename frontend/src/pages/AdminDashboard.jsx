import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-dash">
      {/* Header */}
      <header className="admin-dash-header">
        <div className="admin-dash-header-inner">
          <div className="admin-dash-brand">
            <div className="admin-dash-brand-mark" aria-hidden="true">
              EP
            </div>

            <div className="admin-dash-brand-text">
              <span className="admin-dash-brand-name">Exam Portal</span>
              <span className="admin-dash-brand-caption">Administration</span>
            </div>
          </div>

          <div className="admin-dash-profile">
            <div className="admin-dash-avatar" aria-hidden="true">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div className="admin-dash-user">
              <strong>{user?.name || "Administrator"}</strong>
              <span>{user?.role || "ADMIN"}</span>
            </div>

            <button
              className="ep-btn ep-btn--secondary ep-btn--sm"
              onClick={handleLogout}
              type="button"
            >
              <svg
                className="admin-dash-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H9" />
                <path d="M15 8l4 4-4 4" />
                <path d="M19 12H9.5" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-dash-main">
        <section
          className="admin-dash-intro ep-reveal"
          style={{ "--i": 0 }}
        >
          <div className="admin-dash-intro-panel ep-frame">
            <p className="ep-eyebrow">Administration</p>

            <h1 className="ep-display admin-dash-title">
              Your <em>dashboard</em>
            </h1>

            <p className="admin-dash-intro-text">
              Manage students, examinations, assignments, and results from one
              central workspace.
            </p>
          </div>
        </section>

        {/* Management Cards */}
        <section
          className="admin-dash-section ep-reveal"
          style={{ "--i": 1 }}
        >
          <div className="admin-dash-section-heading">
            <h2>Management</h2>
            <p>Choose an area to manage the exam portal.</p>
          </div>

          <div className="admin-dash-grid">
            {/* Students */}
            <Link
              to="/admin/students"
              className="admin-dash-card ep-card ep-card--interactive ep-reveal"
              style={{ "--i": 2 }}
            >
              <div className="admin-dash-card-top">
                <div className="admin-dash-card-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="8" r="3.25" />
                    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
                    <path d="M16 5.2a3.25 3.25 0 0 1 0 5.6" />
                    <path d="M17.5 14.2A5.5 5.5 0 0 1 20.5 19" />
                  </svg>
                </div>

                <span className="admin-dash-card-index ep-mono">01</span>
              </div>

              <div className="admin-dash-card-content">
                <h3>Manage Students</h3>

                <p>
                  Create student accounts, manage credentials, and control
                  student access.
                </p>
              </div>

              <div className="admin-dash-card-action">
                Open students
                <span className="admin-dash-card-arrow" aria-hidden="true">
                  →
                </span>
              </div>
            </Link>

            {/* Exams */}
            <Link
              to="/admin/exams"
              className="admin-dash-card ep-card ep-card--interactive ep-reveal"
              style={{ "--i": 3 }}
            >
              <div className="admin-dash-card-top">
                <div className="admin-dash-card-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 3.75h7.5L19 8.25V19a1.25 1.25 0 0 1-1.25 1.25H7A1.25 1.25 0 0 1 5.75 19V5A1.25 1.25 0 0 1 7 3.75Z" />
                    <path d="M14.5 3.75v4.5H19" />
                    <path d="M9 12.5h6" />
                    <path d="M9 16h4" />
                  </svg>
                </div>

                <span className="admin-dash-card-index ep-mono">02</span>
              </div>

              <div className="admin-dash-card-content">
                <h3>Manage Exams</h3>

                <p>
                  Create examinations, add questions, publish exams, and assign
                  them to students.
                </p>
              </div>

              <div className="admin-dash-card-action">
                Open exams
                <span className="admin-dash-card-arrow" aria-hidden="true">
                  →
                </span>
              </div>
            </Link>

            {/* Results */}
            <button
              className="admin-dash-card admin-dash-card-button ep-card ep-card--interactive ep-reveal"
              style={{ "--i": 4 }}
              onClick={() => navigate("/admin/results")}
              type="button"
            >
              <div className="admin-dash-card-top">
                <div className="admin-dash-card-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4.5 19.5h15" />
                    <path d="M7 16v-4.5" />
                    <path d="M12 16V7.5" />
                    <path d="M17 16v-6.5" />
                  </svg>
                </div>

                <span className="admin-dash-card-index ep-mono">03</span>
              </div>

              <div className="admin-dash-card-content">
                <h3>View Results</h3>

                <p>
                  Review completed examinations, scores, submission status, and
                  student performance.
                </p>
              </div>

              <div className="admin-dash-card-action">
                Open results
                <span className="admin-dash-card-arrow" aria-hidden="true">
                  →
                </span>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;