import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    students: 0,
    exams: 0,
    hiringDrives: 0,
    results: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          studentsResponse,
          examsResponse,
          drivesResponse,
          resultsResponse,
        ] = await Promise.all([
          api.get("/admin/students"),
          api.get("/exams"),
          api.get("/hiring-drives"),
          api.get("/attempts/all-results"),
        ]);

        setStats({
          students: Array.isArray(studentsResponse.data)
            ? studentsResponse.data.length
            : studentsResponse.data?.students?.length || 0,

          exams: Array.isArray(examsResponse.data)
            ? examsResponse.data.length
            : examsResponse.data?.exams?.length || 0,

          hiringDrives: Array.isArray(drivesResponse.data)
            ? drivesResponse.data.length
            : drivesResponse.data?.hiringDrives?.length || 0,

          results: Array.isArray(resultsResponse.data)
            ? resultsResponse.data.length
            : resultsResponse.data?.attempts?.length || 0,
        });
      } catch (error) {
        console.error("Dashboard data error:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load dashboard statistics."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="admin-dashboard-page">

      {/* Page Header */}
      <header className="dashboard-page-header">
        <div>
          <p className="dashboard-eyebrow">
            ADMINISTRATION
          </p>

          <h1>Dashboard</h1>

          <p>
            Welcome back, {user?.name || "Administrator"}.
            Manage your hiring and examination operations
            from one workspace.
          </p>
        </div>

        <div className="dashboard-date">
          <span>Today</span>
          <strong>
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </strong>
        </div>
      </header>


      {/* Error */}
      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}


      {/* Statistics */}
      <section className="dashboard-stats">

        <div className="stat-card">
          <div className="stat-card-top">
            <span>Students</span>
            <div className="stat-icon">
              S
            </div>
          </div>

          <strong className="stat-value">
            {loading ? "—" : stats.students}
          </strong>

          <span className="stat-description">
            Registered students
          </span>
        </div>


        <div className="stat-card">
          <div className="stat-card-top">
            <span>Exams</span>
            <div className="stat-icon">
              E
            </div>
          </div>

          <strong className="stat-value">
            {loading ? "—" : stats.exams}
          </strong>

          <span className="stat-description">
            Exams created
          </span>
        </div>


        <div className="stat-card">
          <div className="stat-card-top">
            <span>Hiring Drives</span>
            <div className="stat-icon">
              H
            </div>
          </div>

          <strong className="stat-value">
            {loading ? "—" : stats.hiringDrives}
          </strong>

          <span className="stat-description">
            Hiring drives
          </span>
        </div>


        <div className="stat-card">
          <div className="stat-card-top">
            <span>Results</span>
            <div className="stat-icon">
              R
            </div>
          </div>

          <strong className="stat-value">
            {loading ? "—" : stats.results}
          </strong>

          <span className="stat-description">
            Exam attempts
          </span>
        </div>

      </section>


      {/* Main dashboard content */}
      <section className="dashboard-grid">

        {/* Hiring Drives */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Hiring Drives</h2>
              <p>
                Manage active recruitment drives.
              </p>
            </div>

            <Link to="/admin/hiring-drives">
              View all
            </Link>
          </div>

          <div className="panel-content">
            <p>
              Create and manage hiring drives, connect
              batches, assign examinations, and manage
              candidates.
            </p>

            <Link
              to="/admin/hiring-drives"
              className="dashboard-action"
            >
              Manage Hiring Drives
            </Link>
          </div>
        </div>


        {/* Exams */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Examinations</h2>
              <p>
                Manage your examination library.
              </p>
            </div>

            <Link to="/admin/exams">
              View all
            </Link>
          </div>

          <div className="panel-content">
            <p>
              Create exams, configure sections, generate
              questions, and publish examinations.
            </p>

            <Link
              to="/admin/exams/create"
              className="dashboard-action"
            >
              Create New Exam
            </Link>
          </div>
        </div>


        {/* Students */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Students</h2>
              <p>
                Manage registered candidates.
              </p>
            </div>

            <Link to="/admin/students">
              View all
            </Link>
          </div>

          <div className="panel-content">
            <p>
              Add students, upload candidates in bulk,
              manage organizations, and handle credentials.
            </p>

            <Link
              to="/admin/students"
              className="dashboard-action"
            >
              Manage Students
            </Link>
          </div>
        </div>


        {/* Results */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Results</h2>
              <p>
                Review examination performance.
              </p>
            </div>

            <Link to="/admin/results">
              View all
            </Link>
          </div>

          <div className="panel-content">
            <p>
              Review submitted examinations, scores,
              security events, and detailed answers.
            </p>

            <Link
              to="/admin/results"
              className="dashboard-action"
            >
              View Results
            </Link>
          </div>
        </div>

      </section>


      {/* Quick actions */}
      <section className="dashboard-quick-actions">

        <div className="quick-actions-header">
          <div>
            <h2>Quick Actions</h2>
            <p>
              Common administrative tasks.
            </p>
          </div>
        </div>

        <div className="quick-actions-list">

          <Link
            to="/admin/hiring-drives"
            className="quick-action"
          >
            <strong>Create Hiring Drive</strong>
            <span>
              Start a new recruitment drive
            </span>
          </Link>

          <Link
            to="/admin/students"
            className="quick-action"
          >
            <strong>Add Students</strong>
            <span>
              Register individual or bulk candidates
            </span>
          </Link>

          <Link
            to="/admin/exams/create"
            className="quick-action"
          >
            <strong>Create Exam</strong>
            <span>
              Build a new examination
            </span>
          </Link>

          <Link
            to="/admin/question-bank"
            className="quick-action"
          >
            <strong>Question Bank</strong>
            <span>
              Manage reusable questions
            </span>
          </Link>

        </div>

      </section>

    </div>
  );
}

export default AdminDashboard;