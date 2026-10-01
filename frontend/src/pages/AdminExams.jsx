import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminExams.css";

function AdminExams() {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* =========================================================
     LOAD EXAMS
  ========================================================= */

  const loadExams = async () => {
    try {
      setLoading(true);

      const response = await api.get("/exams");

      const examData =
        response.data?.exams ||
        response.data ||
        [];

      setExams(
        Array.isArray(examData)
          ? examData
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load exams",
        error
      );

      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredExams = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return exams.filter((exam) => {
      const matchesSearch =
        !query ||
        exam.title
          ?.toLowerCase()
          .includes(query) ||
        exam.description
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PUBLISHED" &&
          exam.isPublished) ||
        (statusFilter === "DRAFT" &&
          !exam.isPublished);

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    exams,
    search,
    statusFilter,
  ]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredExams.length / pageSize
    )
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginatedExams = useMemo(() => {
    const start =
      (currentPage - 1) * pageSize;

    return filteredExams.slice(
      start,
      start + pageSize
    );
  }, [
    filteredExams,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    pageSize,
  ]);

  /* =========================================================
     COUNTS
  ========================================================= */

  const totalExams = exams.length;

  const publishedExams =
    exams.filter(
      (exam) => exam.isPublished
    ).length;

  const draftExams =
    exams.filter(
      (exam) => !exam.isPublished
    ).length;

  /* =========================================================
     PUBLISH / UNPUBLISH
  ========================================================= */

  const handlePublishToggle = async (
    exam
  ) => {
    try {
      setActionLoading(exam._id);

      if (exam.isPublished) {
        await api.patch(
          `/exams/${exam._id}/unpublish`
        );
      } else {
        await api.patch(
          `/exams/${exam._id}/publish`
        );
      }

      await loadExams();
    } catch (error) {
      console.error(
        "Failed to update exam",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update exam status."
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================================================
     DATE FORMAT
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(
      date
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(
      date
    ).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="exam-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="exam-page-header">

        <div>
          <span className="exam-eyebrow">
            EXAMINATION
          </span>

          <h1>
            Exam Management
          </h1>

          <p>
            View, manage, and monitor all
            examinations created in the portal.
          </p>
        </div>

        <button
          className="exam-primary-button"
          onClick={() =>
            navigate(
              "/admin/exams/create"
            )
          }
        >
          + Create Exam
        </button>

      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="exam-summary">

        <div className="exam-summary-item">

          <div className="exam-summary-icon">
            EX
          </div>

          <div>
            <span>
              Total Exams
            </span>

            <strong>
              {totalExams}
            </strong>
          </div>

        </div>

        <div className="exam-summary-item">

          <div className="exam-summary-icon published">
            ✓
          </div>

          <div>
            <span>
              Published
            </span>

            <strong>
              {publishedExams}
            </strong>
          </div>

        </div>

        <div className="exam-summary-item">

          <div className="exam-summary-icon draft">
            D
          </div>

          <div>
            <span>
              Drafts
            </span>

            <strong>
              {draftExams}
            </strong>
          </div>

        </div>

      </div>

      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <section className="exam-list-card">

        {/* CARD HEADER */}

        <div className="exam-card-header">

          <div>
            <h2>
              All Exams
            </h2>

            <span>
              {filteredExams.length}{" "}
              {filteredExams.length === 1
                ? "exam"
                : "exams"}
            </span>
          </div>

        </div>

        {/* ===================================================
            FILTER BAR
        =================================================== */}

        <div className="exam-toolbar">

          <div className="exam-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search exams..."
            />

            {search && (
              <button
                onClick={() =>
                  setSearch("")
                }
                className="exam-search-clear"
              >
                ×
              </button>
            )}

          </div>

          <div className="exam-filter-field">

            <label>
              STATUS
            </label>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
            >
              <option value="ALL">
                All Exams
              </option>

              <option value="PUBLISHED">
                Published
              </option>

              <option value="DRAFT">
                Draft
              </option>
            </select>

          </div>

          <div className="exam-filter-field rows">

            <label>
              ROWS
            </label>

            <select
              value={pageSize}
              onChange={(e) =>
                setPageSize(
                  Number(
                    e.target.value
                  )
                )
              }
            >
              <option value="5">
                5
              </option>

              <option value="10">
                10
              </option>

              <option value="20">
                20
              </option>

            </select>

          </div>

        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="exam-table-wrapper">

          <table className="exam-table">

            <thead>

              <tr>
                <th>
                  EXAM
                </th>

                <th>
                  DURATION
                </th>

                <th>
                  MARKS
                </th>

                <th>
                  START DATE
                </th>

                <th>
                  END DATE
                </th>

                <th>
                  STATUS
                </th>

                <th>
                  ACTIONS
                </th>
              </tr>

            </thead>

            <tbody>

              {loading ? (
                <tr>

                  <td
                    colSpan="7"
                    className="exam-table-state"
                  >
                    Loading exams...
                  </td>

                </tr>
              ) : paginatedExams.length ===
                0 ? (
                <tr>

                  <td
                    colSpan="7"
                    className="exam-table-state"
                  >

                    <div className="exam-empty">

                      <div className="exam-empty-icon">
                        EX
                      </div>

                      <h3>
                        No exams found
                      </h3>

                      <p>
                        {search ||
                        statusFilter !==
                          "ALL"
                          ? "Try changing your search or filter."
                          : "Create an exam to get started."}
                      </p>

                    </div>

                  </td>

                </tr>
              ) : (
                paginatedExams.map(
                  (exam) => (
                    <tr
                      key={exam._id}
                    >

                      {/* EXAM */}

                      <td>
                        <div className="exam-title-cell">

                          <div className="exam-title-icon">
                            EX
                          </div>

                          <div className="exam-title-content">

                            <strong>
                              {exam.title}
                            </strong>

                            {exam.description && (
                              <span>
                                {
                                  exam.description
                                }
                              </span>
                            )}

                          </div>

                        </div>
                      </td>

                      {/* DURATION */}

                      <td>
                        <span className="exam-table-value">
                          {exam.duration}
                          {" "}
                          min
                        </span>
                      </td>

                      {/* MARKS */}

                      <td>
                        <span className="exam-table-value">
                          {exam.totalMarks ??
                            0}
                        </span>
                      </td>

                      {/* START */}

                      <td>

                        <div className="exam-date-cell">

                          <strong>
                            {formatDate(
                              exam.startDate
                            )}
                          </strong>

                          <span>
                            {formatTime(
                              exam.startDate
                            )}
                          </span>

                        </div>

                      </td>

                      {/* END */}

                      <td>

                        <div className="exam-date-cell">

                          <strong>
                            {formatDate(
                              exam.endDate
                            )}
                          </strong>

                          <span>
                            {formatTime(
                              exam.endDate
                            )}
                          </span>

                        </div>

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`exam-status ${
                            exam.isPublished
                              ? "published"
                              : "draft"
                          }`}
                        >

                          <span className="exam-status-dot" />

                          {exam.isPublished
                            ? "Published"
                            : "Draft"}

                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div className="exam-actions">

                          <button
                            className="exam-manage-button"
                            onClick={() =>
                              navigate(
                                `/admin/exams/${exam._id}/questions`
                              )
                            }
                          >
                            Manage
                          </button>

                          <button
                            className={`exam-publish-button ${
                              exam.isPublished
                                ? "unpublish"
                                : ""
                            }`}
                            disabled={
                              actionLoading ===
                              exam._id
                            }
                            onClick={() =>
                              handlePublishToggle(
                                exam
                              )
                            }
                          >
                            {actionLoading ===
                            exam._id
                              ? "..."
                              : exam.isPublished
                              ? "Unpublish"
                              : "Publish"}
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            PAGINATION
        =================================================== */}

        {!loading &&
          filteredExams.length > 0 && (
            <div className="exam-pagination">

              <span>
                Showing{" "}
                <strong>
                  {(currentPage - 1) *
                    pageSize +
                    1}
                </strong>{" "}
                to{" "}
                <strong>
                  {Math.min(
                    currentPage *
                      pageSize,
                    filteredExams.length
                  )}
                </strong>{" "}
                of{" "}
                <strong>
                  {filteredExams.length}
                </strong>
              </span>

              <div className="exam-pagination-controls">

                <button
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setPage(
                      (prev) =>
                        Math.max(
                          1,
                          prev - 1
                        )
                    )
                  }
                >
                  ←
                </button>

                <span>
                  {currentPage}
                  {" / "}
                  {totalPages}
                </span>

                <button
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      (prev) =>
                        Math.min(
                          totalPages,
                          prev + 1
                        )
                    )
                  }
                >
                  →
                </button>

              </div>

            </div>
          )}

      </section>

    </div>
  );
}

export default AdminExams;