import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminResults.css";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("start-ellipsis");

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < total - 1) pages.push("end-ellipsis");

  pages.push(total);

  return pages;
}

function AdminResults() {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search / filter / pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Result details
  const [selectedResult, setSelectedResult] = useState(null);
  const [loadingResultDetails, setLoadingResultDetails] =
    useState(false);
  const [resultDetailsError, setResultDetailsError] =
    useState("");

  // =========================
  // FETCH RESULTS
  // =========================

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

  // =========================
  // VIEW RESULT
  // =========================

  const handleViewResult = async (attemptId) => {
    try {
      setLoadingResultDetails(true);
      setResultDetailsError("");
      setSelectedResult(null);

      const response = await api.get(
        `/attempts/all-results/${attemptId}`
      );

      setSelectedResult(response.data);
    } catch (error) {
      console.error(
        "Fetch result details error:",
        error
      );

      setResultDetailsError(
        error.response?.data?.message ||
          "Failed to load result details"
      );
    } finally {
      setLoadingResultDetails(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // =========================
  // FORMAT DATE
  // =========================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // =========================
  // COUNTS
  // =========================

  const autoSubmittedCount = results.filter(
    (result) => result.status === "AUTO_SUBMITTED"
  ).length;

  const submittedCount =
    results.length - autoSubmittedCount;

  // =========================
  // SEARCH / FILTER
  // =========================

  const query = searchTerm.trim().toLowerCase();

  const filteredResults = results.filter((result) => {
    const isAuto =
      result.status === "AUTO_SUBMITTED";

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "submitted" && !isAuto) ||
      (statusFilter === "auto" && isAuto);

    if (!matchesStatus) return false;

    if (!query) return true;

    return [
      result.student?.name,
      result.student?.username,
      result.student?.email,
      result.exam?.title,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(query)
    );
  });

  // =========================
  // PAGINATION
  // =========================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredResults.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const startIndex =
    (currentPage - 1) * pageSize;

  const paginatedResults =
    filteredResults.slice(
      startIndex,
      startIndex + pageSize
    );

  const firstShown =
    filteredResults.length === 0
      ? 0
      : startIndex + 1;

  const lastShown =
    startIndex + paginatedResults.length;

  const hasActiveFilters =
    query !== "" || statusFilter !== "all";

  // =========================
  // HANDLERS
  // =========================

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPage(1);
  };

  const showToolbar =
    !loading &&
    !error &&
    results.length > 0;

  return (
    <div
      className="admin-results-page"
      id="results-main"
      tabIndex={-1}
    >
      {/* =========================
          PAGE HEADER
      ========================= */}

      <header className="results-page-header">
        <div>
          <p className="results-eyebrow">
            EXAMINATION
          </p>

          <h1>Exam Results</h1>

          <p>
            Review completed examination attempts,
            scores and submission details.
          </p>
        </div>

        <div className="results-count-group">
          <div className="results-count">
            <span>Total Attempts</span>
            <strong>{results.length}</strong>
          </div>

          <div className="results-count">
            <span>Submitted</span>
            <strong>{submittedCount}</strong>
          </div>

          <div className="results-count">
            <span>Auto Submitted</span>
            <strong>{autoSubmittedCount}</strong>
          </div>
        </div>
      </header>

      {/* =========================
          ALERT
      ========================= */}

      {error && (
        <div className="builder-alert error">
          {error}
        </div>
      )}

      {/* =========================
          RESULTS CARD
      ========================= */}

      <section className="results-management-card">
        <div className="results-card-header">
          <div>
            <h2>Completed Examinations</h2>

            <p>
              View completed attempts, scores and
              submission details.
            </p>
          </div>

          <div className="results-header-actions">
            {!loading &&
              !error &&
              results.length > 0 && (
                <span className="results-list-count">
                  {results.length}{" "}
                  {results.length === 1
                    ? "Result"
                    : "Results"}
                </span>
              )}

            <button
              type="button"
              className="results-refresh-button"
              onClick={fetchResults}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="results-button-spinner" />
                  Refreshing...
                </>
              ) : (
                "Refresh"
              )}
            </button>
          </div>
        </div>

        {/* =========================
            TOOLBAR
        ========================= */}

        {showToolbar && (
          <div className="results-toolbar">
            <div className="results-search">
              <svg
                className="results-search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l4.5 4.5" />
              </svg>

              <label
                htmlFor="result-search"
                className="results-sr-only"
              >
                Search results
              </label>

              <input
                id="result-search"
                type="search"
                placeholder="Search student, username, email or exam"
                value={searchTerm}
                onChange={handleSearchChange}
                autoComplete="off"
              />

              {searchTerm && (
                <button
                  type="button"
                  className="results-search-clear"
                  onClick={() => {
                    setSearchTerm("");
                    setPage(1);
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="results-filter">
              <label htmlFor="result-status-filter">
                Status
              </label>

              <select
                id="result-status-filter"
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <option value="all">All</option>
                <option value="submitted">
                  Submitted
                </option>
                <option value="auto">
                  Auto Submitted
                </option>
              </select>
            </div>

            <div className="results-filter">
              <label htmlFor="result-page-size">
                Rows
              </label>

              <select
                id="result-page-size"
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* =========================
            STATES
        ========================= */}

        {loading && results.length === 0 ? (
          <div className="results-state">
            <span className="results-loading-spinner" />
            <p>Loading results...</p>
          </div>
        ) : error ? (
          <div className="results-state results-error-state">
            <h3>Unable to load results</h3>

            <p>{error}</p>

            <button
              type="button"
              className="results-secondary-button"
              onClick={fetchResults}
            >
              Try Again
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="results-state">
            <div className="results-empty-mark">
              RS
            </div>

            <h3>No completed exams</h3>

            <p>
              Completed examination results will
              appear here once students submit
              their exams.
            </p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="results-state">
            <div className="results-empty-mark">
              0
            </div>

            <h3>No matching results</h3>

            <p>
              Try a different search or change the
              status filter.
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                className="results-secondary-button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* =========================
                TABLE
            ========================= */}

            <div className="results-table-wrapper">
              <table
                className="results-table"
                aria-label="Exam results"
              >
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Exam</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Submitted At</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedResults.map((result) => (
                    <tr key={result._id}>
                      <td>
                        <div className="results-student-cell">
                          <div className="results-table-avatar">
                            {result.student?.name
                              ?.charAt(0)
                              ?.toUpperCase() || "S"}
                          </div>

                          <div className="results-student-info">
                            <strong>
                              {result.student?.name ||
                                "-"}
                            </strong>

                            <span>
                              {result.student
                                ?.username || "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="results-table-secondary">
                          {result.student?.email ||
                            "-"}
                        </span>
                      </td>

                      <td>
                        <div className="results-exam-cell">
                          <strong>
                            {result.exam?.title ||
                              "-"}
                          </strong>

                          <span>
                            {result.exam?.totalMarks
                              ? `${result.exam.totalMarks} total marks`
                              : "Total marks unavailable"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="results-score-cell">
                          <strong>
                            {result.score ?? 0}
                          </strong>

                          <span>
                            /{" "}
                            {result.exam
                              ?.totalMarks || "-"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={
                            result.status ===
                            "AUTO_SUBMITTED"
                              ? "results-status auto-submitted"
                              : "results-status submitted"
                          }
                        >
                          {result.status ===
                          "AUTO_SUBMITTED"
                            ? "Auto Submitted"
                            : "Submitted"}
                        </span>
                      </td>

                      <td>
                        <span className="results-table-secondary results-nowrap">
                          {formatDate(
                            result.submittedAt
                          )}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="results-view-button"
                          onClick={() =>
                            handleViewResult(
                              result._id
                            )
                          }
                        >
                          View Result
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* =========================
                PAGINATION
            ========================= */}

            <div className="results-pagination">
              <p className="results-pagination-info">
                Showing {firstShown}-{lastShown} of{" "}
                {filteredResults.length}
                {hasActiveFilters
                  ? ` (filtered from ${results.length})`
                  : ""}
              </p>

              <nav
                className="results-pagination-controls"
                aria-label="Results pagination"
              >
                <button
                  type="button"
                  className="results-page-button"
                  onClick={() =>
                    setPage(currentPage - 1)
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                {getPageNumbers(
                  currentPage,
                  totalPages
                ).map((item) =>
                  typeof item === "number" ? (
                    <button
                      key={item}
                      type="button"
                      className={
                        item === currentPage
                          ? "results-page-button results-page-number active"
                          : "results-page-button results-page-number"
                      }
                      onClick={() => setPage(item)}
                      aria-label={`Page ${item}`}
                      aria-current={
                        item === currentPage
                          ? "page"
                          : undefined
                      }
                    >
                      {item}
                    </button>
                  ) : (
                    <span
                      key={item}
                      className="results-page-ellipsis"
                    >
                      …
                    </span>
                  )
                )}

                <button
                  type="button"
                  className="results-page-button"
                  onClick={() =>
                    setPage(currentPage + 1)
                  }
                  disabled={
                    currentPage === totalPages
                  }
                >
                  Next
                </button>
              </nav>
            </div>
          </>
        )}
      </section>

      {/* =================================================
          RESULT DETAILS MODAL
      ================================================= */}

      {(loadingResultDetails ||
        resultDetailsError ||
        selectedResult) && (
        <div
          className="results-modal-overlay"
          onClick={() => {
            if (!loadingResultDetails) {
              setSelectedResult(null);
              setResultDetailsError("");
            }
          }}
        >
          <div
            className="results-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="results-modal-header">
              <div>
                <p className="results-eyebrow">
                  RESULT DETAILS
                </p>

                <h2>Examination Result</h2>
              </div>

              <button
                type="button"
                className="results-modal-close"
                onClick={() => {
                  setSelectedResult(null);
                  setResultDetailsError("");
                }}
                disabled={loadingResultDetails}
                aria-label="Close result details"
              >
                ×
              </button>
            </div>

            {loadingResultDetails ? (
              <div className="results-modal-state">
                <span className="results-loading-spinner" />
                <p>
                  Loading result details...
                </p>
              </div>
            ) : resultDetailsError ? (
              <div className="results-modal-state results-error-state">
                <h3>
                  Unable to load result
                </h3>

                <p>
                  {resultDetailsError}
                </p>

                <button
                  type="button"
                  className="results-secondary-button"
                  onClick={() => {
                    setSelectedResult(null);
                    setResultDetailsError("");
                  }}
                >
                  Close
                </button>
              </div>
            ) : selectedResult ? (
              <div className="results-modal-body">
                {/* STUDENT INFORMATION */}

                <section className="results-detail-section">
                  <h3>Student Information</h3>

                  <div className="results-detail-grid">
                    <div className="results-detail-item">
                      <span>Name</span>
                      <strong>
                        {selectedResult.attempt
                          ?.student?.name || "-"}
                      </strong>
                    </div>

                    <div className="results-detail-item">
                      <span>Username</span>
                      <strong>
                        {selectedResult.attempt
                          ?.student?.username || "-"}
                      </strong>
                    </div>

                    <div className="results-detail-item">
                      <span>Email</span>
                      <strong>
                        {selectedResult.attempt
                          ?.student?.email || "-"}
                      </strong>
                    </div>

                    <div className="results-detail-item">
                      <span>College</span>
                      <strong>
                        {selectedResult.attempt
                          ?.student?.college
                          ?.name || "-"}
                      </strong>
                    </div>

                    <div className="results-detail-item">
                      <span>Batch</span>
                      <strong>
                        {selectedResult.attempt
                          ?.student?.batch
                          ?.name || "-"}
                      </strong>
                    </div>

                    <div className="results-detail-item">
                      <span>Branch</span>
                      <strong>
                        {selectedResult.attempt
                          ?.student?.branch || "-"}
                      </strong>
                    </div>
                  </div>
                </section>

                {/* EXAM INFORMATION */}

                <section className="results-detail-section">
                  <h3>Exam Information</h3>

                  <div className="results-detail-grid">
                    <div className="results-detail-item">
                      <span>Hiring Drive</span>
                      <strong>
                        {selectedResult.hiringDrive
                          ?.name || "-"}
                      </strong>
                    </div>

                    <div className="results-detail-item">
                      <span>Company</span>
                      <strong>
                        {selectedResult.hiringDrive
                          ?.companyName || "-"}
                      </strong>
                    </div>

                    <div className="results-detail-item">
                      <span>Exam</span>
                      <strong>
                        {selectedResult.attempt
                          ?.exam?.title || "-"}
                      </strong>
                    </div>

                    <div className="results-detail-item">
                      <span>Status</span>
                      <strong>
                        {selectedResult.attempt
                          ?.status ===
                        "AUTO_SUBMITTED"
                          ? "Auto Submitted"
                          : "Submitted"}
                      </strong>
                    </div>

                    <div className="results-detail-item">
                      <span>Score</span>
                      <strong>
                        {selectedResult.attempt
                          ?.score ?? 0}{" "}
                        /{" "}
                        {selectedResult.totalMarks ??
                          selectedResult.attempt
                            ?.exam?.totalMarks ??
                          "-"}
                      </strong>
                    </div>

                    <div className="results-detail-item">
                      <span>Violations</span>
                      <strong>
                        {selectedResult.attempt
                          ?.violationCount ?? 0}
                      </strong>
                    </div>

                    <div className="results-detail-item">
                      <span>Started At</span>
                      <strong>
                        {formatDate(
                          selectedResult.attempt
                            ?.startedAt
                        )}
                      </strong>
                    </div>

                    <div className="results-detail-item">
                      <span>Submitted At</span>
                      <strong>
                        {formatDate(
                          selectedResult.attempt
                            ?.submittedAt
                        )}
                      </strong>
                    </div>
                  </div>
                </section>

                {/* QUESTION ANALYSIS */}

                <section className="results-detail-section">
                  <div className="results-question-header">
                    <div>
                      <h3>
                        Question Analysis
                      </h3>

                      <p>
                        Review the student's answers
                        against the correct answers.
                      </p>
                    </div>
                  </div>

                  <div className="results-question-list">
                    {(
                      selectedResult.questionResults ||
                      []
                    ).map((question, index) => (
                      <div
                        className="results-question-card"
                        key={
                          question.questionId ||
                          index
                        }
                      >
                        <div className="results-question-top">
                          <span>
                            Question {index + 1}
                          </span>

                          <span
                            className={
                              question.isCorrect
                                ? "results-answer-status correct"
                                : question.selectedAnswer ===
                                  null
                                ? "results-answer-status unanswered"
                                : "results-answer-status incorrect"
                            }
                          >
                            {question.isCorrect
                              ? "Correct"
                              : question.selectedAnswer ===
                                null
                              ? "Not Answered"
                              : "Incorrect"}
                          </span>
                        </div>

                        <h4>
                          {question.questionText}
                        </h4>

                        <div className="results-options-list">
                          {(question.options || []).map(
                            (
                              option,
                              optionIndex
                            ) => (
                              <div
                                key={optionIndex}
                                className={
                                  optionIndex ===
                                  question.correctAnswer
                                    ? "results-option correct-option"
                                    : optionIndex ===
                                      question.selectedAnswer
                                    ? "results-option selected-option"
                                    : "results-option"
                                }
                              >
                                <span>
                                  {String.fromCharCode(
                                    65 +
                                      optionIndex
                                  )}
                                </span>

                                <p>{option}</p>

                                {optionIndex ===
                                  question.correctAnswer && (
                                  <strong>
                                    Correct Answer
                                  </strong>
                                )}

                                {optionIndex ===
                                  question.selectedAnswer &&
                                  optionIndex !==
                                    question.correctAnswer && (
                                    <strong>
                                      Student Answer
                                    </strong>
                                  )}
                              </div>
                            )
                          )}
                        </div>

                        <div className="results-question-footer">
                          <span>
                            Marks:{" "}
                            {question.marks ?? 0}
                          </span>

                          <span>
                            Awarded:{" "}
                            {question.isCorrect
                              ? question.marks ?? 0
                              : 0}
                          </span>
                        </div>
                      </div>
                    ))}

                    {(!selectedResult.questionResults ||
                      selectedResult.questionResults
                        .length === 0) && (
                      <div className="results-question-empty">
                        No question-level analysis is
                        available.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminResults;