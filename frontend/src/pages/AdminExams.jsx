import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminExams.css";

function AdminExams() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examError, setExamError] = useState("");

  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");

  // =========================
  // FETCH EXAMS
  // =========================

  const fetchExams = async () => {
    try {
      setLoadingExams(true);
      setExamError("");

      const response = await api.get("/exams");

      setExams(response.data.exams);
    } catch (error) {
      console.error("Fetch exams error:", error);

      setExamError(
        error.response?.data?.message || "Failed to load exams"
      );
    } finally {
      setLoadingExams(false);
    }
  };

  // =========================
  // FETCH STUDENTS
  // =========================

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      setAssignmentError("");

      const response = await api.get("/admin/students");

      setStudents(response.data.students);
    } catch (error) {
      console.error("Fetch students error:", error);

      setAssignmentError(
        error.response?.data?.message || "Failed to load students"
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchStudents();
  }, []);

  // =========================
  // CREATE EXAM
  // =========================

  const handleCreateExam = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const response = await api.post("/exams", {
        title,
        description,
        duration: Number(duration),
        totalMarks: Number(totalMarks),
        startDate,
        endDate,
      });

      console.log("Exam created:", response.data);

      setSuccess("Exam created successfully.");

      await fetchExams();

      setTitle("");
      setDescription("");
      setDuration("");
      setTotalMarks("");
      setStartDate("");
      setEndDate("");
    } catch (error) {
      console.error("Create exam error:", error);

      setError(
        error.response?.data?.message || "Failed to create exam"
      );
    } finally {
      setCreating(false);
    }
  };

  // =========================
  // ASSIGN EXAM
  // =========================

  const handleAssignExam = async (event) => {
    event.preventDefault();

    try {
      setAssigning(true);

      setAssignmentError("");
      setAssignmentSuccess("");

      if (!selectedExam || !selectedStudent) {
        setAssignmentError("Please select an exam and student.");
        return;
      }

      const response = await api.post("/assignments", {
        exam: selectedExam,
        student: selectedStudent,
      });

      console.log("Assignment created:", response.data);

      setAssignmentSuccess("Exam assigned successfully.");

      setSelectedExam("");
      setSelectedStudent("");
    } catch (error) {
      console.error("Assign exam error:", error);

      setAssignmentError(
        error.response?.data?.message || "Failed to assign exam"
      );
    } finally {
      setAssigning(false);
    }
  };

  // =========================
  // PUBLISH / UNPUBLISH
  // =========================

  const handleTogglePublish = async (exam) => {
    try {
      setError("");
      setSuccess("");

      await api.patch(`/exams/${exam._id}/publish`, {
        isPublished: !exam.isPublished,
      });

      setSuccess(
        exam.isPublished
          ? "Exam unpublished successfully."
          : "Exam published successfully."
      );

      await fetchExams();
    } catch (error) {
      console.error("Update exam publish status error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to update exam status"
      );
    }
  };

  return (
    <div className="admin-exams-page">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <header className="exams-page-header">
        <div>
          <p className="exams-eyebrow">
            ADMINISTRATION
          </p>

          <h1>Exam Management</h1>

          <p>
            Create examinations, assign them to students, and manage
            publication status.
          </p>
        </div>

        <div className="exam-count">
          <span>Total Exams</span>
          <strong>{exams.length}</strong>
        </div>
      </header>

      {/* =========================
          GLOBAL NOTIFICATIONS
      ========================= */}

      {success && (
        <div className="exam-notification success">
          <div>
            <strong>Success</strong>
            <p>{success}</p>
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Close success message"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="exam-notification error">
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

      {/* =========================
          CREATE EXAM
      ========================= */}

      <section className="exam-management-card">

        <div className="exam-card-header">
          <div>
            <h2>Create Exam</h2>

            <p>
              Configure the examination details and schedule.
            </p>
          </div>

          <span className="header-label">
            NEW EXAM
          </span>
        </div>

        <form
          className="create-exam-form"
          onSubmit={handleCreateExam}
        >

          <div className="exam-form-field full-width">
            <label htmlFor="exam-title">
              Exam Title
            </label>

            <input
              id="exam-title"
              type="text"
              placeholder="Enter exam title"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              required
            />
          </div>

          <div className="exam-form-field full-width">
            <label htmlFor="exam-description">
              Description
            </label>

            <textarea
              id="exam-description"
              placeholder="Enter a short description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows="4"
            />
          </div>

          <div className="exam-form-field">
            <label htmlFor="exam-duration">
              Duration
            </label>

            <div className="input-with-unit">
              <input
                id="exam-duration"
                type="number"
                min="1"
                placeholder="60"
                value={duration}
                onChange={(event) =>
                  setDuration(event.target.value)
                }
                required
              />

              <span>minutes</span>
            </div>
          </div>

          <div className="exam-form-field">
            <label htmlFor="exam-marks">
              Total Marks
            </label>

            <input
              id="exam-marks"
              type="number"
              min="1"
              placeholder="100"
              value={totalMarks}
              onChange={(event) =>
                setTotalMarks(event.target.value)
              }
              required
            />
          </div>

          <div className="exam-form-field">
            <label htmlFor="exam-start">
              Start Date & Time
            </label>

            <input
              id="exam-start"
              type="datetime-local"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
              required
            />
          </div>

          <div className="exam-form-field">
            <label htmlFor="exam-end">
              End Date & Time
            </label>

            <input
              id="exam-end"
              type="datetime-local"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
              required
            />
          </div>

          <div className="exam-form-footer">
            <button
              type="submit"
              className="primary-exam-button"
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="exam-button-spinner"></span>
                  Creating...
                </>
              ) : (
                "Create Exam"
              )}
            </button>
          </div>

        </form>
      </section>

      {/* =========================
          ASSIGN EXAM
      ========================= */}

      <section className="exam-management-card">

        <div className="exam-card-header">
          <div>
            <h2>Assign Exam to Student</h2>

            <p>
              Select an examination and an active student to create an
              assignment.
            </p>
          </div>

          <span className="header-label">
            ASSIGNMENT
          </span>
        </div>

        <form
          className="assignment-form"
          onSubmit={handleAssignExam}
        >

          <div className="exam-form-field">
            <label htmlFor="select-exam">
              Examination
            </label>

            <select
              id="select-exam"
              value={selectedExam}
              onChange={(event) =>
                setSelectedExam(event.target.value)
              }
              required
            >
              <option value="">
                Select an exam
              </option>

              {exams.map((exam) => (
                <option
                  key={exam._id}
                  value={exam._id}
                >
                  {exam.title}
                </option>
              ))}
            </select>
          </div>

          <div className="exam-form-field">
            <label htmlFor="select-student">
              Student
            </label>

            {loadingStudents ? (
              <div className="select-loading">
                <span className="small-spinner"></span>
                Loading students...
              </div>
            ) : (
              <select
                id="select-student"
                value={selectedStudent}
                onChange={(event) =>
                  setSelectedStudent(event.target.value)
                }
                required
              >
                <option value="">
                  Select a student
                </option>

                {students
                  .filter((student) => student.isActive)
                  .map((student) => (
                    <option
                      key={student._id}
                      value={student._id}
                    >
                      {student.name} ({student.username})
                    </option>
                  ))}
              </select>
            )}
          </div>

          <div className="assignment-action">
            <button
              type="submit"
              className="primary-exam-button"
              disabled={assigning || loadingStudents}
            >
              {assigning ? (
                <>
                  <span className="exam-button-spinner"></span>
                  Assigning...
                </>
              ) : (
                "Assign Exam"
              )}
            </button>
          </div>

        </form>

        {assignmentSuccess && (
          <div className="assignment-message success">
            <strong>Assignment created</strong>
            <span>{assignmentSuccess}</span>
          </div>
        )}

        {assignmentError && (
          <div className="assignment-message error">
            <strong>Assignment failed</strong>
            <span>{assignmentError}</span>
          </div>
        )}

      </section>

      {/* =========================
          EXISTING EXAMS
      ========================= */}

      <section className="exam-management-card existing-exams-card">

        <div className="exam-card-header">
          <div>
            <h2>Existing Exams</h2>

            <p>
              Manage questions and publication status for your examinations.
            </p>
          </div>

          {!loadingExams && exams.length > 0 && (
            <span className="exam-list-count">
              {exams.length}{" "}
              {exams.length === 1 ? "Exam" : "Exams"}
            </span>
          )}
        </div>

        {loadingExams ? (
          <div className="exam-state">
            <span className="loading-spinner"></span>
            <p>Loading exams...</p>
          </div>
        ) : examError ? (
          <div className="exam-state error-state">
            <h3>Unable to load exams</h3>
            <p>{examError}</p>

            <button
              type="button"
              className="secondary-exam-button"
              onClick={fetchExams}
            >
              Try Again
            </button>
          </div>
        ) : exams.length === 0 ? (
          <div className="exam-state">
            <div className="empty-exam-mark">
              EX
            </div>

            <h3>No exams found</h3>

            <p>
              Create your first examination using the form above.
            </p>
          </div>
        ) : (
          <div className="exam-table-wrapper">
            <table className="exam-table">

              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Duration</th>
                  <th>Marks</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {exams.map((exam) => (
                  <tr key={exam._id}>

                    <td>
                      <div className="exam-table-title">
                        <div className="exam-table-mark">
                          EX
                        </div>

                        <div>
                          <strong>{exam.title}</strong>

                          {exam.description && (
                            <span>
                              {exam.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      {exam.duration} min
                    </td>

                    <td>
                      {exam.totalMarks}
                    </td>

                    <td>
                      {new Date(
                        exam.startDate
                      ).toLocaleString()}
                    </td>

                    <td>
                      {new Date(
                        exam.endDate
                      ).toLocaleString()}
                    </td>

                    <td>
                      <span
                        className={
                          exam.isPublished
                            ? "exam-status published"
                            : "exam-status draft"
                        }
                      >
                        {exam.isPublished
                          ? "Published"
                          : "Draft"}
                      </span>
                    </td>

                    <td>
                      <div className="exam-table-actions">

                        <button
                          type="button"
                          className="table-action manage"
                          onClick={() =>
                            navigate(
                              `/admin/exams/${exam._id}/questions`
                            )
                          }
                        >
                          Questions
                        </button>

                        <button
                          type="button"
                          className={
                            exam.isPublished
                              ? "table-action unpublish"
                              : "table-action publish"
                          }
                          onClick={() =>
                            handleTogglePublish(exam)
                          }
                        >
                          {exam.isPublished
                            ? "Unpublish"
                            : "Publish"}
                        </button>

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

export default AdminExams;