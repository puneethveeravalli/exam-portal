import { useEffect, useState } from "react";
import api from "../services/api";
import "./AdminStudents.css";

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Create student form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [creating, setCreating] = useState(false);

  // Newly created student's credentials
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/students");

      setStudents(response.data.students);
    } catch (error) {
      console.error("Fetch students error:", error);

      setError(
        error.response?.data?.message || "Failed to load students"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCreateStudent = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setSuccessMessage("");
      setCreatedCredentials(null);

      const response = await api.post("/admin/students", {
        name,
        email,
        dateOfBirth,
        phoneNumber,
      });

      setCreatedCredentials(response.data.student);

      setName("");
      setEmail("");
      setDateOfBirth("");
      setPhoneNumber("");

      await fetchStudents();

      setSuccessMessage("Student account created successfully.");
    } catch (error) {
      console.error("Create student error:", error);

      setError(
        error.response?.data?.message || "Failed to create student"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (student) => {
    try {
      setError("");
      setSuccessMessage("");

      await api.patch(`/admin/students/${student._id}/status`, {
        isActive: !student.isActive,
      });

      await fetchStudents();

      setSuccessMessage(
        `${student.name} has been ${
          student.isActive ? "deactivated" : "activated"
        }.`
      );
    } catch (error) {
      console.error("Update student status error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to update student status"
      );
    }
  };

  const copyCredentials = async (student) => {
    const credentials = `Exam Portal Credentials

Name: ${student.name}
Username: ${student.username}
Password: ${student.plainPassword}
Login: ${window.location.origin}/login`;

    try {
      await navigator.clipboard.writeText(credentials);

      setSuccessMessage("Credentials copied to clipboard.");
    } catch (error) {
      console.error("Copy credentials error:", error);

      setError("Failed to copy credentials.");
    }
  };

  const copyCreatedCredentials = async () => {
    if (!createdCredentials) return;

    const credentials = `Exam Portal Credentials

Name: ${createdCredentials.name}
Username: ${createdCredentials.username}
Password: ${createdCredentials.password}
Login: ${window.location.origin}/login`;

    try {
      await navigator.clipboard.writeText(credentials);

      setSuccessMessage("Credentials copied to clipboard.");
    } catch (error) {
      console.error("Copy credentials error:", error);

      setError("Failed to copy credentials.");
    }
  };

  return (
    <div className="admin-students-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="students-page-header">
        <div>
          <p className="students-eyebrow">
            ADMINISTRATION
          </p>

          <h1>Student Management</h1>

          <p>
            Create student accounts and manage access to the exam portal.
          </p>
        </div>

        <div className="students-count">
          <span>Total Students</span>
          <strong>{students.length}</strong>
        </div>
      </header>

      {/* =========================
          NOTIFICATIONS
      ========================= */}

      {error && (
        <div className="notification notification-error">
          <div>
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error message"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="notification notification-success">
          <div>
            <strong>Success</strong>
            <p>{successMessage}</p>
          </div>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Close success message"
          >
            ×
          </button>
        </div>
      )}

      {/* =========================
          CREATE STUDENT
      ========================= */}

      <section className="student-management-card">

        <div className="card-section-header">
          <div>
            <h2>Create Student</h2>

            <p>
              Enter the student's details. Login credentials will be generated
              automatically.
            </p>
          </div>

          <div className="section-label">
            NEW ACCOUNT
          </div>
        </div>

        <form
          className="student-form"
          onSubmit={handleCreateStudent}
        >

          <div className="form-field">
            <label htmlFor="student-name">
              Student Name
            </label>

            <input
              id="student-name"
              type="text"
              placeholder="Enter student name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="student-email">
              Email Address
            </label>

            <input
              id="student-email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="student-dob">
              Date of Birth
            </label>

            <input
              id="student-dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="student-phone">
              Phone Number
            </label>

            <input
              id="student-phone"
              type="tel"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <div className="form-submit-row">
            <button
              className="primary-action"
              type="submit"
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="button-spinner"></span>
                  Creating...
                </>
              ) : (
                "Create Student"
              )}
            </button>
          </div>

        </form>
      </section>

      {/* =========================
          NEW CREDENTIALS
      ========================= */}

      {createdCredentials && (
        <section className="credentials-card">

          <div className="credentials-header">
            <div>
              <p className="credentials-eyebrow">
                ACCOUNT CREATED
              </p>

              <h2>Student Credentials</h2>

              <p>
                Save or copy these credentials and provide them to the student.
              </p>
            </div>

            <div className="credentials-status">
              READY
            </div>
          </div>

          <div className="credentials-grid">

            <div className="credential-item">
              <span>Name</span>
              <strong>{createdCredentials.name}</strong>
            </div>

            <div className="credential-item">
              <span>Email</span>
              <strong>{createdCredentials.email}</strong>
            </div>

            <div className="credential-item">
              <span>Username</span>
              <strong className="credential-value">
                {createdCredentials.username}
              </strong>
            </div>

            <div className="credential-item">
              <span>Password</span>
              <strong className="credential-value">
                {createdCredentials.password}
              </strong>
            </div>

          </div>

          <div className="credentials-footer">
            <button
              type="button"
              className="secondary-action"
              onClick={copyCreatedCredentials}
            >
              Copy Credentials
            </button>
          </div>

        </section>
      )}

      {/* =========================
          STUDENT LIST
      ========================= */}

      <section className="student-management-card student-list-section">

        <div className="card-section-header">
          <div>
            <h2>Students</h2>

            <p>
              View student accounts and manage their access status.
            </p>
          </div>

          {!loading && students.length > 0 && (
            <div className="student-list-count">
              {students.length}{" "}
              {students.length === 1 ? "Student" : "Students"}
            </div>
          )}
        </div>

        {loading ? (
          <div className="students-loading">
            <div className="loading-spinner"></div>
            <p>Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="students-empty">
            <div className="empty-state-mark">
              ST
            </div>

            <h3>No students found</h3>

            <p>
              Create a student account to begin managing students.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="students-table">

              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Date of Birth</th>
                  <th>Phone</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>

                    <td>
                      <div className="student-table-name">
                        <div className="table-avatar">
                          {student.name
                            ?.charAt(0)
                            ?.toUpperCase() || "S"}
                        </div>

                        <strong>
                          {student.name}
                        </strong>
                      </div>
                    </td>

                    <td>
                      <span className="table-secondary">
                        {student.email}
                      </span>
                    </td>

                    <td>
                      {student.dateOfBirth
                        ? new Date(
                            student.dateOfBirth
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>
                      {student.phoneNumber}
                    </td>

                    <td>
                      <span className="credential-text">
                        {student.username}
                      </span>
                    </td>

                    <td>
                      <span className="credential-text">
                        {student.plainPassword || "Not available"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          student.isActive
                            ? "student-status active"
                            : "student-status inactive"
                        }
                      >
                        {student.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">

                        <button
                          type="button"
                          className={
                            student.isActive
                              ? "table-button deactivate"
                              : "table-button activate"
                          }
                          onClick={() =>
                            handleToggleStatus(student)
                          }
                        >
                          {student.isActive
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        {student.plainPassword && (
                          <button
                            type="button"
                            className="table-button copy"
                            onClick={() =>
                              copyCredentials(student)
                            }
                          >
                            Copy
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </section>

    </div>
  );
}

export default AdminStudents;