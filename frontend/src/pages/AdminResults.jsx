import { useEffect, useState } from "react";
import api from "../services/api";
import "./AdminResults.css";

function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/attempts/all-results");

      setResults(response.data.attempts || []);
    } catch (error) {
      console.error("Fetch admin results error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load results"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="admin-results-page">
      <main className="admin-results-container">
        {/* Page Header */}
        <section className="results-header">
          <div>
            <p className="results-eyebrow">Administration</p>

            <h1>Exam Results</h1>

            <p className="results-subtitle">
              Review completed examination attempts and submission details.
            </p>
          </div>

          <button
            type="button"
            className="refresh-results-btn"
            onClick={fetchResults}
            disabled={loading}
          >
            <span className="refresh-icon" aria-hidden="true">
              ↻
            </span>

            {loading ? "Refreshing..." : "Refresh Results"}
          </button>
        </section>

        {/* Summary */}
        <section className="results-summary">
          <div className="summary-card">
            <div className="summary-label">
              Completed Attempts
            </div>

            <div className="summary-value">
              {results.length}
            </div>

            <div className="summary-description">
              Total completed examinations
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="results-card">
          {loading ? (
            <div className="results-state">
              <div className="state-spinner" />

              <h3>Loading results</h3>

              <p>
                Please wait while the examination results are retrieved.
              </p>
            </div>
          ) : error ? (
            <div className="results-state results-error-state">
              <div className="state-icon">!</div>

              <h3>Unable to load results</h3>

              <p>{error}</p>

              <button
                type="button"
                className="retry-btn"
                onClick={fetchResults}
              >
                Try Again
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="results-state">
              <div className="state-icon neutral">—</div>

              <h3>No completed exams</h3>

              <p>
                Completed examination results will appear here once students
                submit their exams.
              </p>
            </div>
          ) : (
            <>
              <div className="results-card-header">
                <div>
                  <h2>Completed Examinations</h2>

                  <p>
                    {results.length}{" "}
                    {results.length === 1
                      ? "result"
                      : "results"}{" "}
                    available
                  </p>
                </div>
              </div>

              <div className="results-table-wrapper">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Contact</th>
                      <th>Exam</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Submitted At</th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.map((result) => (
                      <tr key={result._id}>
                        {/* Student */}
                        <td>
                          <div className="student-cell">
                            <div className="student-avatar">
                              {result.student?.name
                                ? result.student.name
                                    .charAt(0)
                                    .toUpperCase()
                                : "S"}
                            </div>

                            <div className="student-info">
                              <strong>
                                {result.student?.name || "-"}
                              </strong>

                              <span>
                                {result.student?.username || "-"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td>
                          <span className="email-text">
                            {result.student?.email || "-"}
                          </span>
                        </td>

                        {/* Exam */}
                        <td>
                          <div className="exam-cell">
                            <strong>
                              {result.exam?.title || "-"}
                            </strong>

                            <span>
                              {result.exam?.totalMarks
                                ? `${result.exam.totalMarks} total marks`
                                : "Total marks unavailable"}
                            </span>
                          </div>
                        </td>

                        {/* Score */}
                        <td>
                          <div className="score-cell">
                            <strong>
                              {result.score ?? 0}
                            </strong>

                            <span>
                              / {result.exam?.totalMarks || "-"}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            className={`result-status ${
                              result.status === "AUTO_SUBMITTED"
                                ? "auto-submitted"
                                : "submitted"
                            }`}
                          >
                            <span className="status-dot" />

                            {result.status === "AUTO_SUBMITTED"
                              ? "Automatically Submitted"
                              : "Submitted"}
                          </span>
                        </td>

                        {/* Submitted */}
                        <td>
                          <span className="submitted-date">
                            {formatDate(result.submittedAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminResults;