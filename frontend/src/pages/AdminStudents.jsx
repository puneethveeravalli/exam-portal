import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminStudents.css";

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

function AdminStudents() {
  /* =========================================================
     DATA
  ========================================================= */

  const [students, setStudents] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /* =========================================================
     CREATE STUDENT
  ========================================================= */

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [selectedCollege, setSelectedCollege] =
  useState("");

const [selectedBatch, setSelectedBatch] =
  useState("");

const [selectedBranch, setSelectedBranch] =
  useState("");

const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [dateOfBirth, setDateOfBirth] = useState("");
const [phoneNumber, setPhoneNumber] =
  useState("");

  const [creating, setCreating] = useState(false);

  /* =========================================================
     CREATED CREDENTIALS
  ========================================================= */

  const [createdCredentials, setCreatedCredentials] = useState(null);

  /* =========================================================
     BULK UPLOAD
  ========================================================= */

  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkCollege, setBulkCollege] = useState("");
  const [bulkBatch, setBulkBatch] = useState("");
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  /* =========================================================
     SEARCH / FILTER / PAGINATION
  ========================================================= */

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  /* =========================================================
     FETCH STUDENTS
  ========================================================= */

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/students");

      setStudents(response.data.students || []);
    } catch (error) {
      console.error("Fetch students error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load students."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FETCH ORGANIZATION DATA
  ========================================================= */

  const fetchOrganizations = async () => {
    try {
      setLoadingOrganizations(true);

      const [collegeResponse, batchResponse] =
        await Promise.all([
          api.get("/colleges"),
          api.get("/batches"),
        ]);

      setColleges(collegeResponse.data.colleges || []);
      setBatches(batchResponse.data.batches || []);
    } catch (error) {
      console.error(
        "Fetch organizations error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load colleges and batches."
      );
    } finally {
      setLoadingOrganizations(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchOrganizations();
  }, []);

  /* =========================================================
     COUNTS
  ========================================================= */

  const activeCount = students.filter(
    (student) => student.isActive
  ).length;

  const inactiveCount =
    students.length - activeCount;

  /* =========================================================
     AVAILABLE BATCHES
  ========================================================= */

  const filteredBatchesForFilter = useMemo(() => {
    return batches.filter(
      (batch) =>
        collegeFilter === "all" ||
        batch.college?._id === collegeFilter
    );
  }, [batches, collegeFilter]);

  /* =========================================================
     AVAILABLE BRANCHES
  ========================================================= */

  const availableBranches = useMemo(() => {
    const selectedStudents =
      collegeFilter === "all" &&
      batchFilter === "all"
        ? students
        : students.filter((student) => {
            const collegeMatches =
              collegeFilter === "all" ||
              student.college?._id === collegeFilter;

            const batchMatches =
              batchFilter === "all" ||
              student.batch?._id === batchFilter;

            return collegeMatches && batchMatches;
          });

    return [
      ...new Set(
        selectedStudents
          .map((student) => student.branch)
          .filter(Boolean)
      ),
    ].sort();
  }, [
    students,
    collegeFilter,
    batchFilter,
  ]);

  /* =========================================================
     FILTER STUDENTS
  ========================================================= */

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          student.isActive) ||
        (statusFilter === "inactive" &&
          !student.isActive);

      if (!matchesStatus) return false;

      const matchesCollege =
        collegeFilter === "all" ||
        student.college?._id === collegeFilter;

      if (!matchesCollege) return false;

      const matchesBatch =
        batchFilter === "all" ||
        student.batch?._id === batchFilter;

      if (!matchesBatch) return false;

      const matchesBranch =
        branchFilter === "all" ||
        student.branch === branchFilter;

      if (!matchesBranch) return false;

      if (!query) return true;

      return [
        student.name,
        student.email,
        student.username,
        student.phoneNumber,
        student.branch,
        student.college?.name,
        student.batch?.name,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [
    students,
    searchTerm,
    statusFilter,
    collegeFilter,
    batchFilter,
    branchFilter,
  ]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredStudents.length / pageSize
    )
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const startIndex =
    (currentPage - 1) * pageSize;

  const paginatedStudents =
    filteredStudents.slice(
      startIndex,
      startIndex + pageSize
    );

  const firstShown =
    filteredStudents.length === 0
      ? 0
      : startIndex + 1;

  const lastShown =
    startIndex + paginatedStudents.length;

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    collegeFilter !== "all" ||
    batchFilter !== "all" ||
    branchFilter !== "all";

  /* =========================================================
     CREATE STUDENT
  ========================================================= */
 const createStudentBatches = useMemo(() => {
  if (!selectedCollege) {
    return [];
  }

  return batches.filter(
    (batch) =>
      batch.college?._id === selectedCollege
  );
}, [batches, selectedCollege]);

const selectedCreateBatch = useMemo(() => {
  return batches.find(
    (batch) =>
      batch._id === selectedBatch
  );
}, [batches, selectedBatch]);

const createStudentBranches =
  selectedCreateBatch?.branches || [];
  const resetCreateForm = () => {
  setSelectedCollege("");
  setSelectedBatch("");
  setSelectedBranch("");

  setName("");
  setEmail("");
  setDateOfBirth("");
  setPhoneNumber("");
};

  const openCreateModal = () => {
    setError("");
    setSuccessMessage("");
    resetCreateForm();
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (creating) return;

    setShowCreateModal(false);
    resetCreateForm();
  };

  const handleCreateStudent = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setSuccessMessage("");
      setCreatedCredentials(null);

      const response = await api.post(
        "/admin/students",
        {
          name,
          email,
          dateOfBirth,
          phoneNumber,
          collegeId: selectedCollege,
          batchId: selectedBatch,
          branch: selectedBranch
        }
      );

      setCreatedCredentials(
        response.data.student
      );

      setShowCreateModal(false);
      resetCreateForm();

      await fetchStudents();

      setSuccessMessage(
        "Student account created successfully."
      );
    } catch (error) {
      console.error(
        "Create student error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to create student."
      );
    } finally {
      setCreating(false);
    }
  };

  /* =========================================================
     STUDENT STATUS
  ========================================================= */

  const handleToggleStatus = async (student) => {
    try {
      setError("");
      setSuccessMessage("");

      await api.patch(
        `/admin/students/${student._id}/status`,
        {
          isActive: !student.isActive,
        }
      );

      await fetchStudents();

      setSuccessMessage(
        `${student.name} has been ${
          student.isActive
            ? "deactivated"
            : "activated"
        }.`
      );
    } catch (error) {
      console.error(
        "Update student status error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update student status."
      );
    }
  };

  /* =========================================================
     COPY CREDENTIALS
  ========================================================= */

  const copyCredentials = async (student) => {
    const credentials = `Exam Portal Credentials

Name: ${student.name}
Username: ${student.username}
Password: ${student.plainPassword}
Login: ${window.location.origin}/login`;

    try {
      await navigator.clipboard.writeText(
        credentials
      );

      setSuccessMessage(
        "Credentials copied to clipboard."
      );
    } catch (error) {
      console.error(
        "Copy credentials error:",
        error
      );

      setError(
        "Failed to copy credentials."
      );
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
      await navigator.clipboard.writeText(
        credentials
      );

      setSuccessMessage(
        "Credentials copied to clipboard."
      );
    } catch (error) {
      console.error(
        "Copy credentials error:",
        error
      );

      setError(
        "Failed to copy credentials."
      );
    }
  };

  /* =========================================================
     BULK UPLOAD
  ========================================================= */

  const openBulkUpload = () => {
    setError("");
    setSuccessMessage("");
    setBulkCollege("");
    setBulkBatch("");
    setBulkFile(null);
    setBulkResult(null);
    setShowBulkUpload(true);
  };

  const closeBulkUpload = () => {
    if (bulkUploading) return;

    setShowBulkUpload(false);
    setBulkCollege("");
    setBulkBatch("");
    setBulkFile(null);
    setBulkResult(null);
  };

  const handleBulkUpload = async (event) => {
    event.preventDefault();

    if (
      !bulkCollege ||
      !bulkBatch ||
      !bulkFile
    ) {
      setError(
        "Please select college, batch and Excel file."
      );
      return;
    }

    try {
      setBulkUploading(true);
      setError("");
      setSuccessMessage("");
      setBulkResult(null);

      const formData = new FormData();

      formData.append(
        "collegeId",
        bulkCollege
      );

      formData.append(
        "batchId",
        bulkBatch
      );

      formData.append(
        "file",
        bulkFile
      );

      const response = await api.post(
        "/admin/students/bulk-upload",
        formData
      );

      setBulkResult(response.data);

      await fetchStudents();

      setSuccessMessage(
        `Bulk upload completed. ${
          response.data.summary.created
        } students created.`
      );
    } catch (error) {
      console.error(
        "Bulk upload error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to upload students."
      );
    } finally {
      setBulkUploading(false);
    }
  };

  const downloadStudentTemplate = () => {
    const headers =
      "Name,Email,DOB,Phone,Branch\n";

    const example =
      "Rahul Kumar,rahul@gmail.com,2004-05-12,9876543210,CSE\n";

    const blob = new Blob(
      [headers + example],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "student-upload-template.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* =========================================================
     FILTER HANDLERS
  ========================================================= */

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCollegeFilter("all");
    setBatchFilter("all");
    setBranchFilter("all");
    setPage(1);
  };

  const handleCollegeFilterChange = (
    event
  ) => {
    setCollegeFilter(event.target.value);
    setBatchFilter("all");
    setBranchFilter("all");
    setPage(1);
  };

  const handleBatchFilterChange = (
    event
  ) => {
    setBatchFilter(event.target.value);
    setBranchFilter("all");
    setPage(1);
  };

  const handleBranchFilterChange = (
    event
  ) => {
    setBranchFilter(event.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (
    event
  ) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  const handlePageSizeChange = (
    event
  ) => {
    setPageSize(
      Number(event.target.value)
    );
    setPage(1);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="admin-students-page">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <section className="students-page-header">
        <div className="students-page-heading">
          <span className="students-section-kicker">
            STUDENTS
          </span>

          <h1>Student Management</h1>

          <p>
            Create student accounts, manage access,
            and organize students by college, batch,
            and branch.
          </p>
        </div>

        <div className="students-header-actions">
          <button
            type="button"
            className="students-secondary-button"
            onClick={openBulkUpload}
          >
            Bulk Upload
          </button>

          <button
            type="button"
            className="students-primary-button"
            onClick={openCreateModal}
          >
            <span className="button-plus">
              +
            </span>
            Create Student
          </button>
        </div>
      </section>

      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      {error && (
        <div
          className="students-notification students-notification-error"
          role="alert"
        >
          <div>
            <strong>
              Something went wrong
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div
          className="students-notification students-notification-success"
          role="status"
        >
          <div>
            <strong>Success</strong>

            <p>{successMessage}</p>
          </div>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage("")
            }
            aria-label="Close success"
          >
            ×
          </button>
        </div>
      )}

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <section className="students-stat-grid">
        <div className="students-stat-card">
          <div>
            <span>Total Students</span>
            <strong>{students.length}</strong>
          </div>

          <div className="students-stat-icon">
            ST
          </div>
        </div>

        <div className="students-stat-card">
          <div>
            <span>Active Students</span>
            <strong>{activeCount}</strong>
          </div>

          <div className="students-stat-icon students-stat-icon-active">
            AC
          </div>
        </div>

        <div className="students-stat-card">
          <div>
            <span>Inactive Students</span>
            <strong>{inactiveCount}</strong>
          </div>

          <div className="students-stat-icon students-stat-icon-inactive">
            IN
          </div>
        </div>
      </section>

      {/* =====================================================
          CREATED CREDENTIALS
      ===================================================== */}

      {createdCredentials && (
        <section className="students-credentials-card">
          <div className="students-credentials-header">
            <div>
              <span className="students-section-kicker">
                ACCOUNT CREATED
              </span>

              <h2>
                Student credentials generated
              </h2>

              <p>
                Share these credentials securely
                with the student.
              </p>
            </div>

            <button
              type="button"
              className="students-secondary-button"
              onClick={
                copyCreatedCredentials
              }
            >
              Copy Credentials
            </button>
          </div>

          <div className="students-credentials-grid">
            <div>
              <span>Name</span>
              <strong>
                {createdCredentials.name}
              </strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                {createdCredentials.email}
              </strong>
            </div>

            <div>
              <span>Username</span>
              <strong className="students-monospace">
                {createdCredentials.username}
              </strong>
            </div>

            <div>
              <span>Password</span>
              <strong className="students-monospace">
                {createdCredentials.password}
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          STUDENT DIRECTORY
      ===================================================== */}

      <section className="students-directory-card">
        <div className="students-directory-header">
          <div>
            <span className="students-section-kicker">
              DIRECTORY
            </span>

            <h2>Students</h2>

            <p>
              Search and manage registered student
              accounts.
            </p>
          </div>

          {!loading && (
            <div className="students-directory-count">
              {filteredStudents.length}{" "}
              {filteredStudents.length === 1
                ? "student"
                : "students"}
            </div>
          )}
        </div>

        {/* ===================================================
            TOOLBAR
        =================================================== */}

        {!loading && students.length > 0 && (
          <div className="students-toolbar">
            <div className="students-search">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="6.5"
                />

                <path d="M16 16l4.5 4.5" />
              </svg>

              <input
                type="search"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(
                    event.target.value
                  );
                  setPage(1);
                }}
              />

              {searchTerm && (
                <button
                  type="button"
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

            <div className="students-filter">
              <label htmlFor="college-filter">
                College
              </label>

              <select
                id="college-filter"
                value={collegeFilter}
                onChange={
                  handleCollegeFilterChange
                }
              >
                <option value="all">
                  All Colleges
                </option>

                {colleges.map((college) => (
                  <option
                    key={college._id}
                    value={college._id}
                  >
                    {college.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="students-filter">
              <label htmlFor="batch-filter">
                Batch
              </label>

              <select
                id="batch-filter"
                value={batchFilter}
                onChange={
                  handleBatchFilterChange
                }
              >
                <option value="all">
                  All Batches
                </option>

                {filteredBatchesForFilter.map(
                  (batch) => (
                    <option
                      key={batch._id}
                      value={batch._id}
                    >
                      {batch.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="students-filter">
              <label htmlFor="branch-filter">
                Branch
              </label>

              <select
                id="branch-filter"
                value={branchFilter}
                onChange={
                  handleBranchFilterChange
                }
              >
                <option value="all">
                  All Branches
                </option>

                {availableBranches.map(
                  (branch) => (
                    <option
                      key={branch}
                      value={branch}
                    >
                      {branch}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="students-filter">
              <label htmlFor="status-filter">
                Status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={
                  handleStatusFilterChange
                }
              >
                <option value="all">
                  All
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>

            <div className="students-filter students-rows-filter">
              <label htmlFor="page-size">
                Rows
              </label>

              <select
                id="page-size"
                value={pageSize}
                onChange={
                  handlePageSizeChange
                }
              >
                {PAGE_SIZE_OPTIONS.map(
                  (size) => (
                    <option
                      key={size}
                      value={size}
                    >
                      {size}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        )}

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (
          <div className="students-state">
            <div className="students-loader"></div>

            <h3>
              Loading students
            </h3>

            <p>
              Fetching student accounts...
            </p>
          </div>
        ) : students.length === 0 ? (
          /* =================================================
             EMPTY
          ================================================= */

          <div className="students-state">
            <div className="students-state-icon">
              ST
            </div>

            <h3>
              No students yet
            </h3>

            <p>
              Create a student account or upload
              students in bulk to get started.
            </p>

            <button
              type="button"
              className="students-primary-button"
              onClick={openCreateModal}
            >
              Create Student
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          /* =================================================
             NO MATCHES
          ================================================= */

          <div className="students-state">
            <div className="students-state-icon">
              0
            </div>

            <h3>
              No matching students
            </h3>

            <p>
              Try changing your search or filters.
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                className="students-secondary-button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ===============================================
                TABLE
            =============================================== */}

            <div className="students-table-wrapper">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>College</th>
                    <th>Batch</th>
                    <th>Branch</th>
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
                  {paginatedStudents.map(
                    (student) => (
                      <tr key={student._id}>
                        <td>
                          <div className="student-identity">
                            <div className="student-avatar">
                              {student.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "S"}
                            </div>

                            <div>
                              <strong>
                                {student.name}
                              </strong>

                              <span>
                                Student
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="table-muted">
                            {student.college
                              ?.name ||
                              "Not assigned"}
                          </span>
                        </td>

                        <td>
                          <span className="table-muted">
                            {student.batch?.name ||
                              "Not assigned"}
                          </span>
                        </td>

                        <td>
                          {student.branch ? (
                            <span className="branch-badge">
                              {student.branch}
                            </span>
                          ) : (
                            <span className="table-muted">
                              Not assigned
                            </span>
                          )}
                        </td>

                        <td>
                          <span className="table-muted">
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
                          {student.phoneNumber ||
                            "-"}
                        </td>

                        <td>
                          <span className="credential-text">
                            {student.username}
                          </span>
                        </td>

                        <td>
                          <span className="credential-text">
                            {student.plainPassword ||
                              "Not available"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`student-status ${
                              student.isActive
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            <span className="status-dot"></span>
                            {student.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <div className="student-actions">
                            <button
                              type="button"
                              className={
                                student.isActive
                                  ? "student-action danger"
                                  : "student-action success"
                              }
                              onClick={() =>
                                handleToggleStatus(
                                  student
                                )
                              }
                            >
                              {student.isActive
                                ? "Deactivate"
                                : "Activate"}
                            </button>

                            {student.plainPassword && (
                              <button
                                type="button"
                                className="student-action neutral"
                                onClick={() =>
                                  copyCredentials(
                                    student
                                  )
                                }
                              >
                                Copy
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* ===============================================
                PAGINATION
            =============================================== */}

            <div className="students-pagination">
              <p>
                Showing{" "}
                <strong>
                  {firstShown}-{lastShown}
                </strong>{" "}
                of{" "}
                <strong>
                  {filteredStudents.length}
                </strong>

                {hasActiveFilters &&
                  ` (filtered from ${students.length})`}
              </p>

              <div className="students-pagination-controls">
                <button
                  type="button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setPage(
                      currentPage - 1
                    )
                  }
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
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setPage(item)
                      }
                    >
                      {item}
                    </button>
                  ) : (
                    <span
                      key={item}
                      className="pagination-ellipsis"
                    >
                      …
                    </span>
                  )
                )}

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      currentPage + 1
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* =====================================================
          CREATE STUDENT MODAL
      ===================================================== */}

      {showCreateModal && (
        <div
          className="students-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-student-title"
        >
          <div className="students-modal">
            <div className="students-modal-header">
              <div>
                <span className="students-section-kicker">
                  NEW ACCOUNT
                </span>

                <h2 id="create-student-title">
                  Create Student
                </h2>

                <p>
                  Enter the student's details.
                  Login credentials will be
                  generated automatically.
                </p>
              </div>

              <button
                type="button"
                className="students-modal-close"
                onClick={
                  closeCreateModal
                }
                disabled={creating}
                aria-label="Close"
              >
                ×
              </button>
            </div>

           <form
  className="students-create-form"
  onSubmit={handleCreateStudent}
>
  <div className="students-form-section">
    <div className="students-form-section-heading">
      <span>ORGANIZATION</span>
      <p>
        Select where this student belongs.
      </p>
    </div>

    <div className="students-form-grid">
      {/* College */}

      <div className="students-form-field">
        <label htmlFor="student-college">
          College
        </label>

        <select
          id="student-college"
          value={selectedCollege}
          onChange={(event) => {
            setSelectedCollege(
              event.target.value
            );
            setSelectedBatch("");
            setSelectedBranch("");
          }}
          required
          disabled={loadingOrganizations}
        >
          <option value="">
            Select college
          </option>

          {colleges
            .filter((college) => college.isActive)
            .map((college) => (
              <option
                key={college._id}
                value={college._id}
              >
                {college.name}
              </option>
            ))}
        </select>
      </div>

      {/* Batch */}

      <div className="students-form-field">
        <label htmlFor="student-batch">
          Batch
        </label>

        <select
          id="student-batch"
          value={selectedBatch}
          onChange={(event) => {
            setSelectedBatch(
              event.target.value
            );
            setSelectedBranch("");
          }}
          required
          disabled={!selectedCollege}
        >
          <option value="">
            {selectedCollege
              ? "Select batch"
              : "Select college first"}
          </option>

          {createStudentBatches
            .filter((batch) => batch.isActive)
            .map((batch) => (
              <option
                key={batch._id}
                value={batch._id}
              >
                {batch.name} ({batch.year})
              </option>
            ))}
        </select>
      </div>

      {/* Branch */}

      <div className="students-form-field">
        <label htmlFor="student-branch">
          Branch
        </label>

        <select
          id="student-branch"
          value={selectedBranch}
          onChange={(event) =>
            setSelectedBranch(
              event.target.value
            )
          }
          required
          disabled={
            !selectedBatch ||
            createStudentBranches.length === 0
          }
        >
          <option value="">
            {selectedBatch
              ? createStudentBranches.length > 0
                ? "Select branch"
                : "No branches configured"
              : "Select batch first"}
          </option>

          {createStudentBranches.map(
            (branch) => (
              <option
                key={branch.code}
                value={branch.code}
              >
                {branch.name} ({branch.code})
              </option>
            )
          )}
        </select>
      </div>
    </div>
  </div>

  <div className="students-form-divider"></div>

  <div className="students-form-section">
    <div className="students-form-section-heading">
      <span>STUDENT DETAILS</span>
      <p>
        Enter the student's personal information.
      </p>
    </div>

    <div className="students-form-grid">
      {/* Name */}

      <div className="students-form-field">
        <label htmlFor="student-name">
          Student Name
        </label>

        <input
          id="student-name"
          type="text"
          placeholder="Enter student name"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          required
        />
      </div>

      {/* Email */}

      <div className="students-form-field">
        <label htmlFor="student-email">
          Email Address
        </label>

        <input
          id="student-email"
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
        />
      </div>

      {/* DOB */}

      <div className="students-form-field">
        <label htmlFor="student-dob">
          Date of Birth
        </label>

        <input
          id="student-dob"
          type="date"
          value={dateOfBirth}
          onChange={(event) =>
            setDateOfBirth(
              event.target.value
            )
          }
          required
        />
      </div>

      {/* Phone */}

      <div className="students-form-field">
        <label htmlFor="student-phone">
          Phone Number
        </label>

        <input
          id="student-phone"
          type="tel"
          placeholder="Enter phone number"
          value={phoneNumber}
          onChange={(event) =>
            setPhoneNumber(
              event.target.value
            )
          }
          required
        />
      </div>
    </div>
  </div>

  <div className="students-modal-footer">
    <button
      type="button"
      className="students-secondary-button"
      onClick={closeCreateModal}
      disabled={creating}
    >
      Cancel
    </button>

    <button
      type="submit"
      className="students-primary-button"
      disabled={
        creating ||
        !selectedCollege ||
        !selectedBatch ||
        !selectedBranch
      }
    >
      {creating ? (
        <>
          <span className="students-button-spinner"></span>
          Creating...
        </>
      ) : (
        "Create Student"
      )}
    </button>
  </div>
</form>
          </div>
        </div>
      )}

      {/* =====================================================
          BULK UPLOAD MODAL
      ===================================================== */}

      {showBulkUpload && (
        <div
          className="students-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-upload-title"
        >
          <div className="students-modal students-bulk-modal">
            <div className="students-modal-header">
              <div>
                <span className="students-section-kicker">
                  STUDENT IMPORT
                </span>

                <h2 id="bulk-upload-title">
                  Bulk Student Upload
                </h2>

                <p>
                  Upload multiple students
                  using an Excel-compatible
                  file.
                </p>
              </div>

              <button
                type="button"
                className="students-modal-close"
                onClick={
                  closeBulkUpload
                }
                disabled={bulkUploading}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              className="students-bulk-form"
              onSubmit={handleBulkUpload}
            >
              <div className="students-form-grid">
                <div className="students-form-field">
                  <label htmlFor="bulk-college">
                    College
                  </label>

                  <select
                    id="bulk-college"
                    value={bulkCollege}
                    onChange={(event) => {
                      setBulkCollege(
                        event.target.value
                      );
                      setBulkBatch("");
                    }}
                    required
                  >
                    <option value="">
                      Select college
                    </option>

                    {colleges.map(
                      (college) => (
                        <option
                          key={college._id}
                          value={college._id}
                        >
                          {college.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="students-form-field">
                  <label htmlFor="bulk-batch">
                    Batch
                  </label>

                  <select
                    id="bulk-batch"
                    value={bulkBatch}
                    onChange={(event) =>
                      setBulkBatch(
                        event.target.value
                      )
                    }
                    disabled={!bulkCollege}
                    required
                  >
                    <option value="">
                      Select batch
                    </option>

                    {batches
                      .filter(
                        (batch) =>
                          batch.college?._id ===
                          bulkCollege
                      )
                      .map((batch) => (
                        <option
                          key={batch._id}
                          value={batch._id}
                        >
                          {batch.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="students-upload-info">
                <div>
                  <strong>
                    Excel format
                  </strong>

                  <p>
                    Name, Email, DOB, Phone,
                    Branch
                  </p>
                </div>

                <button
                  type="button"
                  className="students-secondary-button"
                  onClick={
                    downloadStudentTemplate
                  }
                >
                  Download Template
                </button>
              </div>

              <label
                htmlFor="bulk-student-file"
                className="students-file-dropzone"
              >
                <span className="students-file-icon">
                  XLS
                </span>

                <strong>
                  {bulkFile
                    ? bulkFile.name
                    : "Choose Excel file"}
                </strong>

                <span>
                  .xlsx or .xls files up to
                  5 MB
                </span>

                <input
                  id="bulk-student-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(event) =>
                    setBulkFile(
                      event.target.files?.[0] ||
                        null
                    )
                  }
                />
              </label>

              {bulkResult && (
                <div className="students-upload-result">
                  <div className="students-upload-result-header">
                    <h3>
                      Upload Summary
                    </h3>
                  </div>

                  <div className="students-result-grid">
                    <div>
                      <span>
                        Total Rows
                      </span>

                      <strong>
                        {
                          bulkResult.summary
                            .totalRows
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Created
                      </span>

                      <strong>
                        {
                          bulkResult.summary
                            .created
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Skipped
                      </span>

                      <strong>
                        {
                          bulkResult.summary
                            .skipped
                        }
                      </strong>
                    </div>
                  </div>

                  {bulkResult
                    .skippedStudents
                    ?.length > 0 && (
                    <div className="students-skipped-list">
                      <strong>
                        Skipped Records
                      </strong>

                      {bulkResult.skippedStudents.map(
                        (
                          item,
                          index
                        ) => (
                          <p key={index}>
                            Row {item.row}:{" "}
                            {item.reason}
                            {item.email
                              ? ` — ${item.email}`
                              : ""}
                          </p>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="students-modal-footer">
                <button
                  type="button"
                  className="students-secondary-button"
                  onClick={
                    closeBulkUpload
                  }
                  disabled={bulkUploading}
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="students-primary-button"
                  disabled={
                    bulkUploading ||
                    !bulkCollege ||
                    !bulkBatch ||
                    !bulkFile
                  }
                >
                  {bulkUploading ? (
                    <>
                      <span className="students-button-spinner"></span>
                      Uploading...
                    </>
                  ) : (
                    "Upload Students"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminStudents;