import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examError, setExamError] = useState("");

  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [resultError, setResultError] = useState("");

  // =========================
  // FETCH ASSIGNED EXAMS
  // =========================

  const fetchMyExams = async () => {
    try {
      setLoadingExams(true);
      setExamError("");

      const response = await api.get("/assignments/my-exams");

      setExams(response.data.exams || []);
    } catch (error) {
      console.error("Fetch my exams error:", error);

      setExamError(
        error.response?.data?.message ||
          "Failed to load exams"
      );
    } finally {
      setLoadingExams(false);
    }
  };

  // =========================
  // FETCH COMPLETED RESULTS
  // =========================

  const fetchMyResults = async () => {
    try {
      setLoadingResults(true);
      setResultError("");

      const response = await api.get("/attempts/my-results");

      setResults(response.data.attempts || []);
    } catch (error) {
      console.error("Fetch my results error:", error);

      setResultError(
        error.response?.data?.message ||
          "Failed to load completed exams"
      );
    } finally {
      setLoadingResults(false);
    }
  };

  // =========================
  // LOAD DASHBOARD DATA
  // =========================

  useEffect(() => {
    fetchMyExams();
    fetchMyResults();
  }, []);

  // =========================
  // START EXAM
  // =========================

  const handleStartExam = async (examId) => {
    try {
      const response = await api.post(
        `/attempts/${examId}/start`
      );

      console.log("Exam started:", response.data);

      navigate("/student/exam", {
        state: response.data,
      });
    } catch (error) {
      console.error("Start exam error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to start exam"
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="student-dashboard">

      {/* =========================
          HEADER
      ========================= */}

      <header className="student-header">
        <div className="student-header-inner">

          <div className="student-brand">
            <div className="student-brand-mark">
              EP
            </div>

            <div>
              <h2>Exam Portal</h2>
              <span>Student Workspace</span>
            </div>
          </div>

          <div className="student-profile">

            <div className="student-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "S"}
            </div>

            <div className="student-user-info">
              <strong>
                {user?.name || "Student"}
              </strong>

              <span>
                {user?.role || "STUDENT"}
              </span>
            </div>

            <button
              className="student-logout"
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>
        </div>
      </header>

      {/* =========================
          MAIN
      ========================= */}

      <main className="student-main">

        {/* Welcome Section */}

        <section className="student-welcome">

          <p className="student-eyebrow">
            STUDENT WORKSPACE
          </p>

          <h1>
            Welcome, {user?.name || "Student"}
          </h1>

          <p>
            View your assigned examinations and review
            your completed exams from one place.
          </p>

        </section>

        {/* =========================
            MY EXAMS
        ========================= */}

        <section className="student-section">

          <div className="student-section-heading">

            <div>
              <h2>My Exams</h2>

              <p>
                Examinations currently assigned to you.
              </p>
            </div>

            {!loadingExams && !examError && exams.length > 0 && (
              <span className="section-count">
                {exams.length}{" "}
                {exams.length === 1 ? "Exam" : "Exams"}
              </span>
            )}

          </div>

          {loadingExams ? (
            <div className="student-state-card">
              <div className="loading-spinner"></div>
              <p>Loading assigned exams...</p>
            </div>
          ) : examError ? (
            <div className="student-state-card error-state">
              <div className="state-label">
                Unable to load exams
              </div>

              <p>{examError}</p>

              <button
                type="button"
                className="secondary-button"
                onClick={fetchMyExams}
              >
                Try Again
              </button>
            </div>
          ) : exams.length === 0 ? (
            <div className="student-state-card">
              <div className="empty-icon">
                EX
              </div>

              <h3>No exams assigned</h3>

              <p>
                Your assigned examinations will appear here
                when they are available.
              </p>
            </div>
          ) : (
            <div className="exam-grid">

              {exams.map((assignment) => {
                const exam = assignment.exam;

                return (
                  <article
                    key={assignment.assignmentId}
                    className="exam-card"
                  >

                    <div className="exam-card-header">

                      <div className="exam-type">
                        EXAM
                      </div>

                      <span
                        className={
                          exam.isPublished
                            ? "status-badge published"
                            : "status-badge unpublished"
                        }
                      >
                        {exam.isPublished
                          ? "Published"
                          : "Not Published"}
                      </span>
                      {assignment.attemptStatus === "IN_PROGRESS" && (
  <span className="status-badge in-progress">
    In Progress
  </span>
)}
                    </div>

                    <div className="exam-card-content">

                      <h3>{exam.title}</h3>

                      <p className="exam-description">
                        {exam.description ||
                          "No description provided for this examination."}
                      </p>

                      <div className="exam-details">

                        <div className="exam-detail">
                          <span>Duration</span>
                          <strong>
                            {exam.duration} min
                          </strong>
                        </div>

                        <div className="exam-detail">
                          <span>Total Marks</span>
                          <strong>
                            {exam.totalMarks}
                          </strong>
                        </div>

                      </div>

                      <div className="exam-schedule">

                        <div>
                          <span>Starts</span>

                          <strong>
                            {new Date(
                              exam.startDate
                            ).toLocaleString()}
                          </strong>
                        </div>

                        <div>
                          <span>Ends</span>

                          <strong>
                            {new Date(
                              exam.endDate
                            ).toLocaleString()}
                          </strong>
                        </div>

                      </div>

                    </div>

                    <div className="exam-card-footer">

                      {exam.isPublished ? (
  <button
    type="button"
    className="start-exam-button"
    onClick={() =>
      handleStartExam(exam._id)
    }
  >
    {assignment.attemptStatus === "IN_PROGRESS"
      ? "Resume Exam"
      : "Start Exam"}

    <span>→</span>
  </button>
) : (
                        <button
                          type="button"
                          className="disabled-exam-button"
                          disabled
                        >
                          Exam Unavailable
                        </button>
                      )}

                    </div>

                  </article>
                );
              })}

            </div>
          )}

        </section>

        {/* =========================
            MY RESULTS
        ========================= */}

        <section className="student-section results-section">

          <div className="student-section-heading">

            <div>
              <h2>My Results</h2>

              <p>
                Your completed examinations and submission details.
              </p>
            </div>

            {!loadingResults &&
              !resultError &&
              results.length > 0 && (
                <span className="section-count">
                  {results.length}{" "}
                  {results.length === 1
                    ? "Completed"
                    : "Completed"}
                </span>
              )}

          </div>

          {loadingResults ? (
            <div className="student-state-card">
              <div className="loading-spinner"></div>
              <p>Loading completed exams...</p>
            </div>
          ) : resultError ? (
            <div className="student-state-card error-state">

              <div className="state-label">
                Unable to load results
              </div>

              <p>{resultError}</p>

              <button
                type="button"
                className="secondary-button"
                onClick={fetchMyResults}
              >
                Try Again
              </button>

            </div>
          ) : results.length === 0 ? (
            <div className="student-state-card">

              <div className="empty-icon">
                RS
              </div>

              <h3>No completed exams</h3>

              <p>
                Your completed examinations will appear here
                after submission.
              </p>

            </div>
          ) : (
            <div className="results-list">

              {results.map((result) => (

                <article
                  key={result._id}
                  className="results-card"
                >

                  <div className="result-main">

                    <div className="result-icon">
                      RS
                    </div>

                    <div className="result-info">

                      <h3>
                        {result.exam.title}
                      </h3>

                      <p>
                        Exam completed successfully.
                      </p>

                    </div>

                  </div>

                  <div className="result-meta">

                    <div>
                      <span>Status</span>

                      <strong className="completed-status">
                        Completed
                      </strong>
                    </div>

                    <div>
                      <span>Submitted At</span>

                      <strong>
                        {new Date(
                          result.submittedAt
                        ).toLocaleString()}
                      </strong>
                    </div>

                  </div>

                </article>

              ))}

            </div>
          )}

        </section>

      </main>
    </div>
  );
}

export default StudentDashboard;