import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./AdminHiringDrives.css";

function AdminHiringDrives() {
  const [drives, setDrives] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [batches, setBatches] = useState([]);
  const [exams, setExams] = useState([]);

  const [selectedDrive, setSelectedDrive] = useState(null);
  const [driveBatches, setDriveBatches] = useState([]);
  const [driveExams, setDriveExams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);

  const [form, setForm] = useState({
    name: "",
    companyName: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [assignmentType, setAssignmentType] = useState("COLLEGE");
  const [selectedBranch, setSelectedBranch] = useState("");

  /* =========================================================
     LOAD HIRING DRIVES
  ========================================================= */

  const loadDrives = async () => {
    try {
      const response = await api.get("/hiring-drives");

      const driveData =
        response.data?.drives ||
        response.data?.hiringDrives ||
        response.data ||
        [];

      setDrives(
        Array.isArray(driveData) ? driveData : []
      );
    } catch (error) {
      console.error(
        "Failed to load hiring drives",
        error
      );

      setDrives([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOAD ORGANIZATIONS
  ========================================================= */

  const loadOrganizations = async () => {
    try {
      const [collegeResponse, batchResponse] =
        await Promise.all([
          api.get("/colleges"),
          api.get("/batches"),
        ]);

      const collegeData =
        collegeResponse.data?.colleges ||
        collegeResponse.data ||
        [];

      const batchData =
        batchResponse.data?.batches ||
        batchResponse.data ||
        [];

      setColleges(
        Array.isArray(collegeData)
          ? collegeData
          : []
      );

      setBatches(
        Array.isArray(batchData)
          ? batchData
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load organizations",
        error
      );

      setColleges([]);
      setBatches([]);
    }
  };

  /* =========================================================
     LOAD EXAMS
  ========================================================= */

  const loadExams = async () => {
    try {
      const response = await api.get("/exams");

      const examData =
        response.data?.exams ||
        response.data ||
        [];

      const examList = Array.isArray(examData)
        ? examData
        : [];

      setExams(
        examList.filter(
          (exam) => exam.isPublished
        )
      );
    } catch (error) {
      console.error(
        "Failed to load exams",
        error
      );

      setExams([]);
    }
  };

  useEffect(() => {
    loadDrives();
    loadOrganizations();
    loadExams();
  }, []);

  /* =========================================================
     LOAD DRIVE DETAILS
  ========================================================= */

  const loadDriveDetails = async (drive) => {
    try {
      setSelectedDrive(drive);
      setLoadingDetails(true);

      const [batchResponse, examResponse] =
        await Promise.all([
          api.get(
            `/hiring-drive-batches/drive/${drive._id}`
          ),
          api.get(
            `/hiring-drive-exams/drive/${drive._id}`
          ),
        ]);

      const batchData =
        batchResponse.data?.batches ||
        batchResponse.data?.hiringDriveBatches ||
        batchResponse.data ||
        [];

      const examData =
        examResponse.data?.exams ||
        examResponse.data?.hiringDriveExams ||
        examResponse.data ||
        [];

      setDriveBatches(
        Array.isArray(batchData)
          ? batchData
          : []
      );

      setDriveExams(
        Array.isArray(examData)
          ? examData
          : []
      );

      // Reset assignment selections when switching drive
      setSelectedCollege("");
      setSelectedBatch("");
      setSelectedBranch("");
      setSelectedExam("");
      setAssignmentType("COLLEGE");
    } catch (error) {
      console.error(
        "Failed to load drive details",
        error
      );

      setDriveBatches([]);
      setDriveExams([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  /* =========================================================
     CREATE HIRING DRIVE
  ========================================================= */

  const handleCreateDrive = async (event) => {
    event.preventDefault();

    try {
      await api.post(
        "/hiring-drives",
        form
      );

      setForm({
        name: "",
        companyName: "",
        description: "",
        startDate: "",
        endDate: "",
      });

      setShowCreate(false);

      await loadDrives();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to create hiring drive"
      );
    }
  };

  /* =========================================================
     ADD BATCH
  ========================================================= */

  const handleAddBatch = async (event) => {
    event.preventDefault();

    if (!selectedCollege || !selectedBatch) {
      alert("Select college and batch");
      return;
    }

    try {
      await api.post(
        `/hiring-drive-batches/drive/${selectedDrive._id}`,
        {
          collegeId: selectedCollege,
          batchId: selectedBatch,
        }
      );

      setSelectedCollege("");
      setSelectedBatch("");
      setShowAddBatch(false);

      await loadDriveDetails(selectedDrive);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to add batch"
      );
    }
  };

  /* =========================================================
     ADD EXAM
  ========================================================= */

  const handleAddExam = async (event) => {
    event.preventDefault();

    if (!selectedExam) {
      alert("Select an exam");
      return;
    }

    try {
      await api.post(
        `/hiring-drive-exams/drive/${selectedDrive._id}`,
        {
          examId: selectedExam,
        }
      );

      setSelectedExam("");
      setShowAddExam(false);

      await loadDriveDetails(selectedDrive);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to attach exam"
      );
    }
  };

  /* =========================================================
     REMOVE BATCH
  ========================================================= */

  const handleRemoveBatch = async (id) => {
    if (
      !window.confirm(
        "Remove this batch from the drive?"
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/hiring-drive-batches/${id}`
      );

      await loadDriveDetails(selectedDrive);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to remove batch"
      );
    }
  };

  /* =========================================================
     REMOVE EXAM
  ========================================================= */

  const handleRemoveExam = async (id) => {
    if (
      !window.confirm(
        "Remove this exam from the drive?"
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/hiring-drive-exams/${id}`
      );

      await loadDriveDetails(selectedDrive);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to remove exam"
      );
    }
  };

  /* =========================================================
     AVAILABLE BATCHES
  ========================================================= */

  const availableBatches = useMemo(() => {
    if (!selectedCollege) {
      return [];
    }

    return batches.filter((batch) => {
      const collegeId =
        typeof batch.college === "object"
          ? batch.college?._id
          : batch.college;

      return collegeId === selectedCollege;
    });
  }, [batches, selectedCollege]);

  /* =========================================================
     SELECTED BATCH
  ========================================================= */

  const selectedBatchData = useMemo(() => {
    return batches.find(
      (batch) => batch._id === selectedBatch
    );
  }, [batches, selectedBatch]);

  /* =========================================================
     AVAILABLE BRANCHES
  ========================================================= */

  const availableBranches = useMemo(() => {
    if (!selectedBatchData) {
      return [];
    }

    return Array.isArray(
      selectedBatchData.branches
    )
      ? selectedBatchData.branches
      : [];
  }, [selectedBatchData]);

  /* =========================================================
     AVAILABLE EXAMS
  ========================================================= */

  const availableExams = exams.filter(
    (exam) =>
      !driveExams.some(
        (item) =>
          item.exam?._id === exam._id
      )
  );

  /* =========================================================
     PARTICIPATING COLLEGES
  ========================================================= */

  const participatingColleges = useMemo(() => {
    const map = new Map();

    driveBatches.forEach((item) => {
      if (!item.college?._id) {
        return;
      }

      if (!map.has(item.college._id)) {
        map.set(item.college._id, {
          _id: item.college._id,
          name: item.college.name,
          code: item.college.code,
        });
      }
    });

    return Array.from(map.values());
  }, [driveBatches]);

  /* =========================================================
     PARTICIPATING BATCHES
  ========================================================= */

  const participatingBatches = useMemo(() => {
    if (!selectedCollege) {
      return [];
    }

    return driveBatches.filter(
      (item) =>
        item.college?._id === selectedCollege
    );
  }, [driveBatches, selectedCollege]);

  /* =========================================================
     SELECTED DRIVE BATCH
  ========================================================= */

  const selectedDriveBatch = useMemo(() => {
    return driveBatches.find(
      (item) =>
        item._id === selectedBatch
    );
  }, [driveBatches, selectedBatch]);

  /* =========================================================
     PARTICIPATING BRANCHES
  ========================================================= */

  const participatingBranches = useMemo(() => {
    if (!selectedDriveBatch) {
      return [];
    }

    return Array.isArray(
      selectedDriveBatch.batch?.branches
    )
      ? selectedDriveBatch.batch.branches
      : [];
  }, [selectedDriveBatch]);

  /* =========================================================
     ASSIGN EXAM BY SCOPE
  ========================================================= */

  const assignExamByScope = async () => {
    if (!selectedExam) {
      alert("Please select an exam.");
      return;
    }

    if (!selectedCollege) {
      alert(
        "Please select a participating college."
      );
      return;
    }

    if (
      (assignmentType === "BATCH" ||
        assignmentType === "BRANCH") &&
      !selectedBatch
    ) {
      alert(
        "Please select a participating batch."
      );
      return;
    }

    if (
      assignmentType === "BRANCH" &&
      !selectedBranch
    ) {
      alert("Please select a branch.");
      return;
    }

    const selectedExamData =
      driveExams.find(
        (item) =>
          item.exam?._id === selectedExam
      );

    const selectedCollegeData =
      participatingColleges.find(
        (college) =>
          college._id === selectedCollege
      );

    const selectedBranchData =
      participatingBranches.find(
        (branch) =>
          branch.code === selectedBranch
      );

    let scopeDescription =
      selectedCollegeData?.name || "";

    if (assignmentType === "BATCH") {
      scopeDescription +=
        ` → ${selectedDriveBatch?.batch?.name}`;
    }

    if (assignmentType === "BRANCH") {
      scopeDescription +=
        ` → ${selectedDriveBatch?.batch?.name}`;

      scopeDescription +=
        ` → ${
          selectedBranchData?.name ||
          selectedBranch
        }`;
    }

    const confirmed = window.confirm(
      `Assign "${selectedExamData?.exam?.title}" to:\n\n` +
        `${scopeDescription}\n\n` +
        `Continue?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await api.post(
        "/assignments/scope",
        {
          driveId: selectedDrive._id,
          examId: selectedExam,
          assignmentType,
          collegeId: selectedCollege,

          ...(assignmentType !==
            "COLLEGE" && {
            batchId:
              selectedDriveBatch?.batch?._id,
          }),

          ...(assignmentType ===
            "BRANCH" && {
            branch: selectedBranch,
          }),
        }
      );

      const summary =
        response.data?.summary;

      alert(
        `Exam assigned successfully.\n\n` +
          `Scope: ${scopeDescription}\n\n` +
          `Eligible students: ${
            summary?.totalStudents || 0
          }\n` +
          `Newly assigned: ${
            summary?.assigned || 0
          }\n` +
          `Already assigned: ${
            summary?.alreadyAssigned || 0
          }`
      );

      setSelectedExam("");
      setSelectedCollege("");
      setSelectedBatch("");
      setSelectedBranch("");
      setAssignmentType("COLLEGE");
    } catch (error) {
      console.error(
        "Exam assignment error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to assign exam."
      );
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="hiring-page">
        <div className="hiring-loading">
          Loading hiring drives...
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="hiring-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="hiring-page-header">
        <div>
          <span className="hiring-eyebrow">
            HIRING DRIVES
          </span>

          <h1>Hiring Drives</h1>

          <p>
            Manage company hiring drives,
            participating batches, examinations,
            and student assignments.
          </p>
        </div>

        <button
          className="hiring-primary-button"
          onClick={() =>
            setShowCreate(true)
          }
        >
          + Create Hiring Drive
        </button>
      </div>

      {/* =====================================================
          DRIVE WORKSPACE
      ===================================================== */}

      <div className="hiring-workspace">

        {/* ===================================================
            DRIVE LIST
        =================================================== */}

        <section className="hiring-list-card">

          <div className="hiring-card-header">
            <div>
              <h2>Hiring Drives</h2>

              <span>
                {drives.length} drive
                {drives.length !== 1
                  ? "s"
                  : ""}
              </span>
            </div>
          </div>

          {drives.length === 0 ? (
            <div className="hiring-empty">
              <div className="hiring-empty-icon">
                HD
              </div>

              <h3>No hiring drives</h3>

              <p>
                Create your first hiring drive
                to begin assigning exams.
              </p>
            </div>
          ) : (
            <div className="hiring-drive-list">

              {drives.map((drive) => (
                <button
                  key={drive._id}
                  className={`hiring-drive-item ${
                    selectedDrive?._id ===
                    drive._id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    loadDriveDetails(
                      drive
                    )
                  }
                >
                  <div className="hiring-drive-avatar">
                    {drive.companyName
                      ?.charAt(0)
                      ?.toUpperCase() ||
                      "D"}
                  </div>

                  <div className="hiring-drive-info">
                    <strong>
                      {drive.name}
                    </strong>

                    <span>
                      {drive.companyName ||
                        "Company not specified"}
                    </span>
                  </div>

                  <span
                    className={`hiring-status ${
                      String(
                        drive.status ||
                          "DRAFT"
                      ).toLowerCase()
                    }`}
                  >
                    {drive.status ||
                      "DRAFT"}
                  </span>
                </button>
              ))}

            </div>
          )}
        </section>

        {/* ===================================================
            DRIVE DETAILS
        =================================================== */}

        <section className="hiring-details-card">

          {!selectedDrive ? (
            <div className="hiring-select-state">

              <div className="hiring-select-icon">
                HD
              </div>

              <h2>
                Select a Hiring Drive
              </h2>

              <p>
                Select a drive from the left
                to manage participating batches,
                exams, and student assignments.
              </p>

            </div>
          ) : (
            <>

              {/* DETAIL HEADER */}

              <div className="hiring-detail-header">

                <div>
                  <span className="hiring-eyebrow">
                    HIRING DRIVE
                  </span>

                  <h2>
                    {selectedDrive.name}
                  </h2>

                  <p>
                    {selectedDrive.companyName}
                  </p>
                </div>

                <span
                  className={`hiring-status large ${
                    String(
                      selectedDrive.status ||
                        "DRAFT"
                    ).toLowerCase()
                  }`}
                >
                  {selectedDrive.status ||
                    "DRAFT"}
                </span>

              </div>

              {loadingDetails ? (
                <div className="hiring-detail-loading">
                  Loading drive details...
                </div>
              ) : (
                <div className="hiring-detail-content">

                  {/* =================================================
                      DRIVE OVERVIEW
                  ================================================= */}

                  <div className="hiring-section">

                    <div className="hiring-section-heading">
                      <div>
                        <h3>
                          Drive Overview
                        </h3>

                        <p>
                          Basic information about
                          this hiring drive.
                        </p>
                      </div>
                    </div>

                    <div className="hiring-overview-grid">

                      <div className="hiring-overview-item">
                        <span>
                          Company
                        </span>

                        <strong>
                          {selectedDrive.companyName ||
                            "—"}
                        </strong>
                      </div>

                      <div className="hiring-overview-item">
                        <span>
                          Status
                        </span>

                        <strong>
                          {selectedDrive.status ||
                            "DRAFT"}
                        </strong>
                      </div>

                      <div className="hiring-overview-item">
                        <span>
                          Start Date
                        </span>

                        <strong>
                          {selectedDrive.startDate
                            ? new Date(
                                selectedDrive.startDate
                              ).toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "—"}
                        </strong>
                      </div>

                      <div className="hiring-overview-item">
                        <span>
                          End Date
                        </span>

                        <strong>
                          {selectedDrive.endDate
                            ? new Date(
                                selectedDrive.endDate
                              ).toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "—"}
                        </strong>
                      </div>

                    </div>

                    {selectedDrive.description && (
                      <div className="hiring-description">
                        <span>
                          Description
                        </span>

                        <p>
                          {
                            selectedDrive.description
                          }
                        </p>
                      </div>
                    )}

                  </div>

                  {/* =================================================
                      PARTICIPATING BATCHES
                  ================================================= */}

                  <div className="hiring-section">

                    <div className="hiring-section-heading">
                      <div>
                        <h3>
                          Participating Batches
                        </h3>

                        <p>
                          Colleges and student
                          batches participating
                          in this drive.
                        </p>
                      </div>

                      <button
                        className="hiring-secondary-button"
                        onClick={() =>
                          setShowAddBatch(true)
                        }
                      >
                        + Add Batch
                      </button>
                    </div>

                    {driveBatches.length ===
                    0 ? (
                      <div className="hiring-small-empty">
                        No batches added yet.
                      </div>
                    ) : (
                      <div className="hiring-data-list">

                        {driveBatches.map(
                          (item) => (
                            <div
                              className="hiring-data-row"
                              key={item._id}
                            >

                              <div className="hiring-row-main">

                                <div className="hiring-row-icon">
                                  {item.college?.name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                    "C"}
                                </div>

                                <div>
                                  <strong>
                                    {
                                      item.batch
                                        ?.name
                                    }
                                  </strong>

                                  <span>
                                    {
                                      item.college
                                        ?.name
                                    }
                                    {" • "}
                                    {
                                      item.batch
                                        ?.year
                                    }
                                  </span>
                                </div>

                              </div>

                              <button
                                className="hiring-remove-button"
                                onClick={() =>
                                  handleRemoveBatch(
                                    item._id
                                  )
                                }
                              >
                                Remove
                              </button>

                            </div>
                          )
                        )}

                      </div>
                    )}

                  </div>

                  {/* =================================================
                      ASSIGNED EXAMS
                  ================================================= */}

                  <div className="hiring-section">

                    <div className="hiring-section-heading">
                      <div>
                        <h3>
                          Assigned Exams
                        </h3>

                        <p>
                          Published examinations
                          available for this
                          hiring drive.
                        </p>
                      </div>

                      <button
                        className="hiring-secondary-button"
                        onClick={() =>
                          setShowAddExam(true)
                        }
                      >
                        + Assign Exam
                      </button>
                    </div>

                    {driveExams.length ===
                    0 ? (
                      <div className="hiring-small-empty">
                        No exams attached yet.
                      </div>
                    ) : (
                      <div className="hiring-data-list">

                        {driveExams.map(
                          (item) => (
                            <div
                              className="hiring-data-row"
                              key={item._id}
                            >

                              <div className="hiring-row-main">

                                <div className="hiring-row-icon exam">
                                  EX
                                </div>

                                <div>
                                  <strong>
                                    {
                                      item.exam
                                        ?.title
                                    }
                                  </strong>

                                  <span>
                                    {
                                      item.exam
                                        ?.duration
                                    }{" "}
                                    minutes
                                    {" • "}
                                    {
                                      item.exam
                                        ?.totalMarks
                                    }{" "}
                                    marks
                                  </span>
                                </div>

                              </div>

                              <button
                                className="hiring-remove-button"
                                onClick={() =>
                                  handleRemoveExam(
                                    item._id
                                  )
                                }
                              >
                                Remove
                              </button>

                            </div>
                          )
                        )}

                      </div>
                    )}

                  </div>

                  {/* =================================================
                      ASSIGN STUDENTS
                  ================================================= */}

                  {driveExams.length > 0 && (
                    <div className="hiring-assignment-card">

                      <div className="hiring-assignment-header">

                        <div>
                          <span className="hiring-section-kicker">
                            STUDENT ASSIGNMENT
                          </span>

                          <h3>
                            Assign Exam
                          </h3>

                          <p>
                            Choose an exam and
                            decide which
                            participating
                            students should
                            receive it.
                          </p>
                        </div>

                      </div>

                      <div className="hiring-assignment-form">

                        {/* EXAM */}

                        <div className="hiring-field">
                          <label>
                            Exam
                          </label>

                          <select
                            value={
                              selectedExam
                            }
                            onChange={(e) =>
                              setSelectedExam(
                                e.target.value
                              )
                            }
                          >
                            <option value="">
                              Select an exam
                            </option>

                            {driveExams.map(
                              (
                                driveExam
                              ) => (
                                <option
                                  key={
                                    driveExam._id
                                  }
                                  value={
                                    driveExam
                                      .exam?._id
                                  }
                                >
                                  {
                                    driveExam
                                      .exam
                                      ?.title
                                  }
                                  {" — "}
                                  {
                                    driveExam
                                      .exam
                                      ?.totalMarks
                                  }{" "}
                                  marks
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        {/* ASSIGNMENT TYPE */}

                        <div className="hiring-scope-box">

                          <div className="hiring-scope-heading">
                            <strong>
                              Who should receive
                              this exam?
                            </strong>

                            <span>
                              Only students
                              participating
                              through this
                              hiring drive
                              can be selected.
                            </span>
                          </div>

                          <div className="hiring-scope-options">

                            <label
                              className={`hiring-scope-option ${
                                assignmentType ===
                                "COLLEGE"
                                  ? "active"
                                  : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name="assignmentType"
                                value="COLLEGE"
                                checked={
                                  assignmentType ===
                                  "COLLEGE"
                                }
                                onChange={() => {
                                  setAssignmentType(
                                    "COLLEGE"
                                  );
                                  setSelectedCollege(
                                    ""
                                  );
                                  setSelectedBatch(
                                    ""
                                  );
                                  setSelectedBranch(
                                    ""
                                  );
                                }}
                              />

                              <div>
                                <strong>
                                  Entire College
                                </strong>

                                <span>
                                  All active
                                  students from
                                  participating
                                  batches of a
                                  college.
                                </span>
                              </div>
                            </label>

                            <label
                              className={`hiring-scope-option ${
                                assignmentType ===
                                "BATCH"
                                  ? "active"
                                  : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name="assignmentType"
                                value="BATCH"
                                checked={
                                  assignmentType ===
                                  "BATCH"
                                }
                                onChange={() => {
                                  setAssignmentType(
                                    "BATCH"
                                  );
                                  setSelectedCollege(
                                    ""
                                  );
                                  setSelectedBatch(
                                    ""
                                  );
                                  setSelectedBranch(
                                    ""
                                  );
                                }}
                              />

                              <div>
                                <strong>
                                  Entire Batch
                                </strong>

                                <span>
                                  All active
                                  students in one
                                  participating
                                  batch.
                                </span>
                              </div>
                            </label>

                            <label
                              className={`hiring-scope-option ${
                                assignmentType ===
                                "BRANCH"
                                  ? "active"
                                  : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name="assignmentType"
                                value="BRANCH"
                                checked={
                                  assignmentType ===
                                  "BRANCH"
                                }
                                onChange={() => {
                                  setAssignmentType(
                                    "BRANCH"
                                  );
                                  setSelectedCollege(
                                    ""
                                  );
                                  setSelectedBatch(
                                    ""
                                  );
                                  setSelectedBranch(
                                    ""
                                  );
                                }}
                              />

                              <div>
                                <strong>
                                  Specific Branch
                                </strong>

                                <span>
                                  Students from
                                  one branch of
                                  a participating
                                  batch.
                                </span>
                              </div>
                            </label>

                          </div>
                        </div>

                        {/* COLLEGE */}

                        <div className="hiring-field">
                          <label>
                            Participating College
                          </label>

                          <select
                            value={
                              selectedCollege
                            }
                            onChange={(e) => {
                              setSelectedCollege(
                                e.target.value
                              );
                              setSelectedBatch(
                                ""
                              );
                              setSelectedBranch(
                                ""
                              );
                            }}
                          >
                            <option value="">
                              Select participating
                              college
                            </option>

                            {participatingColleges.map(
                              (college) => (
                                <option
                                  key={
                                    college._id
                                  }
                                  value={
                                    college._id
                                  }
                                >
                                  {
                                    college.name
                                  }
                                  {college.code
                                    ? ` (${college.code})`
                                    : ""}
                                </option>
                              )
                            )}
                          </select>

                          {participatingColleges.length ===
                            0 && (
                            <span className="hiring-field-help error">
                              Add at least one
                              batch to this
                              hiring drive
                              first.
                            </span>
                          )}
                        </div>

                        {/* BATCH */}

                        {(assignmentType ===
                          "BATCH" ||
                          assignmentType ===
                            "BRANCH") && (
                          <div className="hiring-field">
                            <label>
                              Participating Batch
                            </label>

                            <select
                              value={
                                selectedBatch
                              }
                              onChange={(e) => {
                                setSelectedBatch(
                                  e.target.value
                                );
                                setSelectedBranch(
                                  ""
                                );
                              }}
                              disabled={
                                !selectedCollege
                              }
                            >
                              <option value="">
                                Select participating
                                batch
                              </option>

                              {participatingBatches.map(
                                (item) => (
                                  <option
                                    key={
                                      item._id
                                    }
                                    value={
                                      item._id
                                    }
                                  >
                                    {
                                      item.batch
                                        ?.name
                                    }
                                    {" — "}
                                    {
                                      item.batch
                                        ?.year
                                    }
                                  </option>
                                )
                              )}
                            </select>

                            {selectedCollege &&
                              participatingBatches.length ===
                                0 && (
                                <span className="hiring-field-help error">
                                  No batches from
                                  this college
                                  are participating
                                  in this drive.
                                </span>
                              )}
                          </div>
                        )}

                        {/* BRANCH */}

                        {assignmentType ===
                          "BRANCH" && (
                          <div className="hiring-field">
                            <label>
                              Branch
                            </label>

                            <select
                              value={
                                selectedBranch
                              }
                              onChange={(e) =>
                                setSelectedBranch(
                                  e.target.value
                                )
                              }
                              disabled={
                                !selectedBatch
                              }
                            >
                              <option value="">
                                Select branch
                              </option>

                              {participatingBranches.map(
                                (branch) => (
                                  <option
                                    key={
                                      branch.code
                                    }
                                    value={
                                      branch.code
                                    }
                                  >
                                    {
                                      branch.name
                                    }
                                    {" ("}
                                    {
                                      branch.code
                                    }
                                    {")"}
                                  </option>
                                )
                              )}
                            </select>

                            {selectedBatch &&
                              participatingBranches.length ===
                                0 && (
                                <span className="hiring-field-help error">
                                  No branches are
                                  configured for
                                  this batch.
                                </span>
                              )}
                          </div>
                        )}

                        {/* SUMMARY */}

                        {selectedExam &&
                          selectedCollege &&
                          (assignmentType ===
                            "COLLEGE" ||
                            selectedBatch) &&
                          (assignmentType !==
                            "BRANCH" ||
                            selectedBranch) && (
                            <div className="hiring-assignment-summary">

                              <div>
                                <span>
                                  Exam
                                </span>

                                <strong>
                                  {
                                    driveExams.find(
                                      (item) =>
                                        item.exam
                                          ?._id ===
                                        selectedExam
                                    )?.exam
                                      ?.title
                                  }
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Assignment
                                </span>

                                <strong>
                                  {assignmentType ===
                                    "COLLEGE" &&
                                    "Entire College"}

                                  {assignmentType ===
                                    "BATCH" &&
                                    "Entire Batch"}

                                  {assignmentType ===
                                    "BRANCH" &&
                                    "Specific Branch"}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  College
                                </span>

                                <strong>
                                  {
                                    participatingColleges.find(
                                      (
                                        college
                                      ) =>
                                        college._id ===
                                        selectedCollege
                                    )?.name
                                  }
                                </strong>
                              </div>

                              {selectedDriveBatch && (
                                <div>
                                  <span>
                                    Batch
                                  </span>

                                  <strong>
                                    {
                                      selectedDriveBatch
                                        .batch
                                        ?.name
                                    }
                                    {" — "}
                                    {
                                      selectedDriveBatch
                                        .batch
                                        ?.year
                                    }
                                  </strong>
                                </div>
                              )}

                              {selectedBranch && (
                                <div>
                                  <span>
                                    Branch
                                  </span>

                                  <strong>
                                    {
                                      participatingBranches.find(
                                        (
                                          branch
                                        ) =>
                                          branch.code ===
                                          selectedBranch
                                      )?.name
                                    }
                                    {" ("}
                                    {
                                      selectedBranch
                                    }
                                    {")"}
                                  </strong>
                                </div>
                              )}

                            </div>
                          )}

                        {/* ACTION */}

                        <div className="hiring-assignment-actions">

                          <button
                            type="button"
                            className="hiring-assign-button"
                            onClick={
                              assignExamByScope
                            }
                            disabled={
                              !selectedExam ||
                              !selectedCollege ||
                              (assignmentType !==
                                "COLLEGE" &&
                                !selectedBatch) ||
                              (assignmentType ===
                                "BRANCH" &&
                                !selectedBranch)
                            }
                          >
                            Assign Exam to Students
                          </button>

                        </div>

                      </div>
                    </div>
                  )}

                </div>
              )}

            </>
          )}

        </section>
      </div>

      {/* =====================================================
          CREATE HIRING DRIVE MODAL
      ===================================================== */}

      {showCreate && (
        <div className="hiring-modal-overlay">

          <div className="hiring-modal">

            <div className="hiring-modal-header">

              <div>
                <span className="hiring-modal-kicker">
                  NEW DRIVE
                </span>

                <h2>
                  Create Hiring Drive
                </h2>

                <p>
                  Create a new company hiring
                  drive.
                </p>
              </div>

              <button
                className="hiring-modal-close"
                onClick={() =>
                  setShowCreate(false)
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleCreateDrive}
            >

              <div className="hiring-form-section">

                <div className="hiring-form-section-heading">
                  <span>
                    DRIVE INFORMATION
                  </span>

                  <p>
                    Enter the basic information
                    for the hiring drive.
                  </p>
                </div>

                <div className="hiring-form-field">
                  <label>
                    Drive Name
                  </label>

                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name:
                          e.target.value,
                      })
                    }
                    placeholder="TCS Campus Hiring Drive"
                    required
                  />
                </div>

                <div className="hiring-form-field">
                  <label>
                    Company Name
                  </label>

                  <input
                    value={
                      form.companyName
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        companyName:
                          e.target.value,
                      })
                    }
                    placeholder="TCS"
                    required
                  />
                </div>

                <div className="hiring-form-field">
                  <label>
                    Description
                  </label>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description:
                          e.target.value,
                      })
                    }
                    placeholder="Hiring drive description"
                  />
                </div>

                <div className="hiring-form-grid">

                  <div className="hiring-form-field">
                    <label>
                      Start Date
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        form.startDate
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          startDate:
                            e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="hiring-form-field">
                    <label>
                      End Date
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        form.endDate
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          endDate:
                            e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                </div>

              </div>

              <div className="hiring-modal-actions">

                <button
                  type="button"
                  className="hiring-cancel-button"
                  onClick={() =>
                    setShowCreate(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="hiring-primary-button"
                >
                  Create Drive
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          ADD BATCH MODAL
      ===================================================== */}

      {showAddBatch &&
        selectedDrive && (
          <div className="hiring-modal-overlay">

            <div className="hiring-modal">

              <div className="hiring-modal-header">

                <div>
                  <span className="hiring-modal-kicker">
                    PARTICIPATION
                  </span>

                  <h2>
                    Add Batch
                  </h2>

                  <p>
                    Select the college and
                    batch for this drive.
                  </p>
                </div>

                <button
                  className="hiring-modal-close"
                  onClick={() =>
                    setShowAddBatch(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={
                  handleAddBatch
                }
              >

                <div className="hiring-form-field">
                  <label>
                    College
                  </label>

                  <select
                    value={
                      selectedCollege
                    }
                    onChange={(e) => {
                      setSelectedCollege(
                        e.target.value
                      );
                      setSelectedBatch(
                        ""
                      );
                    }}
                    required
                  >
                    <option value="">
                      Select College
                    </option>

                    {colleges.map(
                      (college) => (
                        <option
                          key={
                            college._id
                          }
                          value={
                            college._id
                          }
                        >
                          {college.name} (
                          {college.code})
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="hiring-form-field">
                  <label>
                    Batch
                  </label>

                  <select
                    value={
                      selectedBatch
                    }
                    onChange={(e) =>
                      setSelectedBatch(
                        e.target.value
                      )
                    }
                    disabled={
                      !selectedCollege
                    }
                    required
                  >
                    <option value="">
                      Select Batch
                    </option>

                    {availableBatches.map(
                      (batch) => (
                        <option
                          key={
                            batch._id
                          }
                          value={
                            batch._id
                          }
                        >
                          {batch.name} -{" "}
                          {batch.year}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="hiring-modal-actions">

                  <button
                    type="button"
                    className="hiring-cancel-button"
                    onClick={() =>
                      setShowAddBatch(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="hiring-primary-button"
                  >
                    Add Batch
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}

      {/* =====================================================
          ADD EXAM MODAL
      ===================================================== */}

      {showAddExam &&
        selectedDrive && (
          <div className="hiring-modal-overlay">

            <div className="hiring-modal">

              <div className="hiring-modal-header">

                <div>
                  <span className="hiring-modal-kicker">
                    EXAMINATION
                  </span>

                  <h2>
                    Assign Exam
                  </h2>

                  <p>
                    Select a published exam
                    for this hiring drive.
                  </p>
                </div>

                <button
                  className="hiring-modal-close"
                  onClick={() =>
                    setShowAddExam(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={
                  handleAddExam
                }
              >

                <div className="hiring-form-field">
                  <label>
                    Published Exam
                  </label>

                  <select
                    value={
                      selectedExam
                    }
                    onChange={(e) =>
                      setSelectedExam(
                        e.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select Exam
                    </option>

                    {availableExams.map(
                      (exam) => (
                        <option
                          key={
                            exam._id
                          }
                          value={
                            exam._id
                          }
                        >
                          {exam.title} —{" "}
                          {
                            exam.totalMarks
                          }{" "}
                          marks
                        </option>
                      )
                    )}
                  </select>
                </div>

                {availableExams.length ===
                  0 && (
                  <div className="hiring-form-info">
                    All published exams are
                    already attached to this
                    drive.
                  </div>
                )}

                <div className="hiring-modal-actions">

                  <button
                    type="button"
                    className="hiring-cancel-button"
                    onClick={() =>
                      setShowAddExam(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="hiring-primary-button"
                    disabled={
                      availableExams.length ===
                      0
                    }
                  >
                    Assign Exam
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}

    </div>
  );
}

export default AdminHiringDrives;