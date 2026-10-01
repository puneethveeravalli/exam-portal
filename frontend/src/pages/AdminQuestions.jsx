import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./AdminQuestions.css";

const emptyQuestionForm = {
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  marks: 1,
};

const emptyExamForm = {
  title: "",
  description: "",
  duration: 60,
  startDate: "",
  endDate: "",
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateInput = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const pad = (number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getCorrectOptionLabel = (answer) => {
  const labels = ["A", "B", "C", "D"];
  return labels[Number(answer)] || "—";
};

function AdminQuestions() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [sections, setSections] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingExam, setSavingExam] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("ALL");

  const [showExamModal, setShowExamModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState(null);

  const [examForm, setExamForm] = useState(emptyExamForm);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ------------------------------------------------------------
  // FETCH EXAM
  // ------------------------------------------------------------
  const fetchExam = async () => {
    try {
      const response = await api.get("/exams");

      const exams = response.data.exams || [];

      const foundExam = exams.find(
        (item) => item._id === examId
      );

      if (!foundExam) {
        throw new Error("Exam not found");
      }

      setExam(foundExam);

      setExamForm({
        title: foundExam.title || "",
        description: foundExam.description || "",
        duration: foundExam.duration || 60,
        startDate: formatDateInput(foundExam.startDate),
        endDate: formatDateInput(foundExam.endDate),
      });
    } catch (err) {
      console.error("Fetch exam error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load exam"
      );
    }
  };

  // ------------------------------------------------------------
  // FETCH SECTIONS
  // ------------------------------------------------------------
  const fetchSections = async () => {
    try {
      const response = await api.get(
        `/exam-sections/exam/${examId}`
      );

      setSections(response.data.sections || []);
    } catch (err) {
      console.error("Fetch sections error:", err);

      /*
       * Sections are important for grouping questions,
       * but don't block the entire page if the endpoint
       * returns an error.
       */
      setSections([]);
    }
  };

  // ------------------------------------------------------------
  // FETCH EXAM QUESTIONS
  // ------------------------------------------------------------
  const fetchQuestions = async () => {
    try {
      const response = await api.get(
        `/exam-questions/exam/${examId}`
      );

      setQuestions(response.data.questions || []);
    } catch (err) {
      console.error("Fetch exam questions error:", err);

      throw err;
    }
  };

  // ------------------------------------------------------------
  // INITIAL LOAD
  // ------------------------------------------------------------
  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchExam(),
        fetchSections(),
        fetchQuestions(),
      ]);
    } catch (err) {
      console.error("Load manage exam page error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load exam questions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, [examId]);

  // ------------------------------------------------------------
  // DERIVED DATA
  // ------------------------------------------------------------
  const sectionMap = useMemo(() => {
    const map = {};

    sections.forEach((section) => {
      map[section._id] = section;
    });

    return map;
  }, [sections]);

  const groupedQuestions = useMemo(() => {
    const groups = {};

    questions.forEach((question) => {
      const sectionId =
        question.section?._id ||
        question.section ||
        "unassigned";

      if (!groups[sectionId]) {
        groups[sectionId] = [];
      }

      groups[sectionId].push(question);
    });

    Object.keys(groups).forEach((sectionId) => {
      groups[sectionId].sort(
        (a, b) => Number(a.order || 0) - Number(b.order || 0)
      );
    });

    return groups;
  }, [questions]);

  const sectionOptions = useMemo(() => {
    return sections
      .slice()
      .sort(
        (a, b) =>
          Number(a.order || 0) - Number(b.order || 0)
      );
  }, [sections]);

  const filteredQuestions = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return questions.filter((question) => {
      const questionSectionId =
        question.section?._id ||
        question.section ||
        "unassigned";

      const matchesSection =
        selectedSection === "ALL" ||
        questionSectionId === selectedSection;

      if (!matchesSection) return false;

      if (!searchValue) return true;

      const questionText =
        question.questionText?.toLowerCase() || "";

      const options = Array.isArray(question.options)
        ? question.options.join(" ").toLowerCase()
        : "";

      return (
        questionText.includes(searchValue) ||
        options.includes(searchValue)
      );
    });
  }, [questions, search, selectedSection]);

  const filteredGroupedQuestions = useMemo(() => {
    const groups = {};

    filteredQuestions.forEach((question) => {
      const sectionId =
        question.section?._id ||
        question.section ||
        "unassigned";

      if (!groups[sectionId]) {
        groups[sectionId] = [];
      }

      groups[sectionId].push(question);
    });

    return groups;
  }, [filteredQuestions]);

  const totalQuestionMarks = useMemo(() => {
    return questions.reduce(
      (total, question) =>
        total + Number(question.marks || 0),
      0
    );
  }, [questions]);

  // ------------------------------------------------------------
  // CLEAR ALERTS
  // ------------------------------------------------------------
  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // ------------------------------------------------------------
  // EXAM FORM
  // ------------------------------------------------------------
  const handleExamChange = (event) => {
    const { name, value } = event.target;

    setExamForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ------------------------------------------------------------
  // SAVE EXAM
  // ------------------------------------------------------------
  const handleSaveExam = async (event) => {
    event.preventDefault();

    try {
      setSavingExam(true);
      clearMessages();

      const response = await api.patch(
        `/exams/${examId}`,
        {
          title: examForm.title,
          description: examForm.description,
          duration: Number(examForm.duration),
          startDate: examForm.startDate,
          endDate: examForm.endDate,
        }
      );

      setExam(response.data.exam);

      setShowExamModal(false);

      setSuccess(
        response.data.message ||
          "Exam details updated successfully."
      );
    } catch (err) {
      console.error("Update exam error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update exam"
      );
    } finally {
      setSavingExam(false);
    }
  };

  // ------------------------------------------------------------
  // OPEN QUESTION EDIT MODAL
  // ------------------------------------------------------------
  const openQuestionEditor = (question) => {
    clearMessages();

    setEditingQuestion(question);

    setQuestionForm({
      questionText: question.questionText || "",
      options:
        Array.isArray(question.options) &&
        question.options.length === 4
          ? [...question.options]
          : ["", "", "", ""],
      correctAnswer: Number(question.correctAnswer || 0),
      marks: Number(question.marks || 1),
    });

    setShowQuestionModal(true);
  };

  // ------------------------------------------------------------
  // QUESTION FORM CHANGE
  // ------------------------------------------------------------
  const handleQuestionTextChange = (event) => {
    setQuestionForm((previous) => ({
      ...previous,
      questionText: event.target.value,
    }));
  };

  const handleQuestionOptionChange = (index, value) => {
    setQuestionForm((previous) => {
      const updatedOptions = [...previous.options];

      updatedOptions[index] = value;

      return {
        ...previous,
        options: updatedOptions,
      };
    });
  };

  const handleCorrectAnswerChange = (event) => {
    setQuestionForm((previous) => ({
      ...previous,
      correctAnswer: Number(event.target.value),
    }));
  };

  const handleQuestionMarksChange = (event) => {
    setQuestionForm((previous) => ({
      ...previous,
      marks: event.target.value,
    }));
  };

  // ------------------------------------------------------------
  // SAVE QUESTION
  // ------------------------------------------------------------
  const handleSaveQuestion = async (event) => {
    event.preventDefault();

    if (!editingQuestion) return;

    try {
      setSavingQuestion(true);
      clearMessages();

      if (!questionForm.questionText.trim()) {
        setError("Question text is required.");
        return;
      }

      if (
        questionForm.options.some(
          (option) => !String(option).trim()
        )
      ) {
        setError("All four options are required.");
        return;
      }

      if (
        Number(questionForm.marks) <= 0 ||
        !questionForm.marks
      ) {
        setError("Marks must be greater than 0.");
        return;
      }

      const response = await api.patch(
        `/exam-questions/${editingQuestion._id}`,
        {
          questionText: questionForm.questionText.trim(),
          options: questionForm.options.map((option) =>
            String(option).trim()
          ),
          correctAnswer: Number(
            questionForm.correctAnswer
          ),
          marks: Number(questionForm.marks),
        }
      );

      setQuestions((previous) =>
        previous.map((question) =>
          question._id === editingQuestion._id
            ? response.data.question
            : question
        )
      );

      setShowQuestionModal(false);
      setEditingQuestion(null);

      setSuccess(
        response.data.message ||
          "Question updated successfully."
      );
    } catch (err) {
      console.error("Update question error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update question"
      );
    } finally {
      setSavingQuestion(false);
    }
  };

  // ------------------------------------------------------------
  // DELETE ONE QUESTION
  // ------------------------------------------------------------
  const handleDeleteQuestion = async (question) => {
    const confirmed = window.confirm(
      "Remove this question from the exam?\n\nThis will not delete the question from the Question Bank."
    );

    if (!confirmed) return;

    try {
      setDeletingQuestionId(question._id);
      clearMessages();

      const response = await api.delete(
        `/exam-questions/${question._id}`
      );

      setQuestions((previous) =>
        previous.filter(
          (item) => item._id !== question._id
        )
      );

      await fetchSections();

      setSuccess(
        response.data.message ||
          "Question removed successfully."
      );
    } catch (err) {
      console.error("Delete question error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to remove question"
      );
    } finally {
      setDeletingQuestionId(null);
    }
  };

  // ------------------------------------------------------------
  // PUBLISH / UNPUBLISH
  // ------------------------------------------------------------
  const handlePublishToggle = async () => {
    if (!exam) return;

    const nextStatus = !exam.isPublished;

    if (
      nextStatus &&
      questions.length === 0
    ) {
      setError(
        "This exam does not have any generated questions."
      );
      return;
    }

    if (nextStatus) {
      const confirmed = window.confirm(
        "Publish this exam?\n\nStudents will be able to access it according to the assigned exam schedule."
      );

      if (!confirmed) return;
    }

    try {
      setPublishing(true);
      clearMessages();

      const response = await api.patch(
        `/exams/${examId}/publish`,
        {
          isPublished: nextStatus,
        }
      );

      setExam(response.data.exam);

      setSuccess(
        response.data.message ||
          (nextStatus
            ? "Exam published successfully."
            : "Exam unpublished successfully.")
      );
    } catch (err) {
      console.error(
        "Publish status update error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update exam status"
      );
    } finally {
      setPublishing(false);
    }
  };

  // ------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="admin-questions-page">
        <div className="questions-loading">
          <div className="questions-spinner" />
          <p>Loading exam management...</p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // PAGE
  // ------------------------------------------------------------
  return (
    <div className="admin-questions-page">
      <div className="admin-questions-container">

        {/* PAGE HEADER */}
        <header className="questions-page-header">
          <div>
            <div className="questions-eyebrow">
              EXAMINATION / MANAGE EXAM
            </div>

            <h1>{exam?.title || "Exam Management"}</h1>

            <p>
              Review and manage the sections and
              questions configured for this examination.
            </p>
          </div>

          <div className="questions-header-actions">
            <button
              type="button"
              className="questions-btn questions-btn-secondary"
              onClick={() =>
                navigate("/admin/exams")
              }
            >
              ← Back to Exams
            </button>

            <button
              type="button"
              className="questions-btn questions-btn-primary"
              onClick={() => {
                clearMessages();
                setShowExamModal(true);
              }}
            >
              Edit Exam
            </button>
          </div>
        </header>

        {/* ALERTS */}
        {error && (
          <div className="questions-alert questions-alert-error">
            <span>!</span>
            <p>{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="questions-alert questions-alert-success">
            <span>✓</span>
            <p>{success}</p>

            <button
              type="button"
              onClick={() => setSuccess("")}
            >
              ×
            </button>
          </div>
        )}

        {/* EXAM OVERVIEW */}
        {exam && (
          <section className="questions-overview-card">
            <div className="questions-overview-top">
              <div>
                <div className="questions-card-kicker">
                  EXAM OVERVIEW
                </div>

                <h2>{exam.title}</h2>

                {exam.description && (
                  <p className="questions-overview-description">
                    {exam.description}
                  </p>
                )}
              </div>

              <div
                className={`questions-status ${
                  exam.isPublished
                    ? "questions-status-published"
                    : "questions-status-draft"
                }`}
              >
                <span />
                {exam.isPublished
                  ? "Published"
                  : "Draft"}
              </div>
            </div>

            <div className="questions-overview-grid">
              <div className="questions-overview-item">
                <span>Duration</span>
                <strong>
                  {exam.duration} min
                </strong>
              </div>

              <div className="questions-overview-item">
                <span>Total Marks</span>
                <strong>
                  {exam.totalMarks}
                </strong>
              </div>

              <div className="questions-overview-item">
                <span>Questions</span>
                <strong>
                  {questions.length}
                </strong>
              </div>

              <div className="questions-overview-item">
                <span>Calculated Marks</span>
                <strong>
                  {totalQuestionMarks}
                </strong>
              </div>

              <div className="questions-overview-item">
                <span>Start Date</span>
                <strong>
                  {formatDateTime(
                    exam.startDate
                  )}
                </strong>
              </div>

              <div className="questions-overview-item">
                <span>End Date</span>
                <strong>
                  {formatDateTime(exam.endDate)}
                </strong>
              </div>
            </div>

            <div className="questions-overview-footer">
              <div>
                <span className="questions-footer-label">
                  EXAM STATUS
                </span>

                <span className="questions-footer-text">
                  {exam.isPublished
                    ? "Students can access this exam according to the configured schedule."
                    : "This exam is currently a draft and is not published."}
                </span>
              </div>

              <button
                type="button"
                className={`questions-btn ${
                  exam.isPublished
                    ? "questions-btn-danger-outline"
                    : "questions-btn-primary"
                }`}
                onClick={handlePublishToggle}
                disabled={publishing}
              >
                {publishing
                  ? "Updating..."
                  : exam.isPublished
                  ? "Unpublish Exam"
                  : "Publish Exam"}
              </button>
            </div>
          </section>
        )}

        {/* QUESTIONS WORKSPACE */}
        <section className="questions-workspace-card">
          <div className="questions-workspace-header">
            <div>
              <div className="questions-card-kicker">
                QUESTION MANAGEMENT
              </div>

              <h2>Exam Questions</h2>

              <p>
                These are the questions currently
                assigned to this examination.
              </p>
            </div>

            <div className="questions-count-badge">
              {questions.length} Questions
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="questions-toolbar">
            <div className="questions-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </div>

            <div className="questions-filter">
              <label>Section</label>

              <select
                value={selectedSection}
                onChange={(event) =>
                  setSelectedSection(
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All Sections
                </option>

                {sectionOptions.map((section) => (
                  <option
                    key={section._id}
                    value={section._id}
                  >
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FILTER RESULT INFO */}
          {(search || selectedSection !== "ALL") && (
            <div className="questions-filter-info">
              Showing{" "}
              <strong>
                {filteredQuestions.length}
              </strong>{" "}
              of{" "}
              <strong>{questions.length}</strong>{" "}
              questions
            </div>
          )}

          {/* EMPTY */}
          {questions.length === 0 ? (
            <div className="questions-empty-state">
              <div className="questions-empty-icon">
                ?
              </div>

              <h3>No questions found</h3>

              <p>
                This examination does not have any
                generated questions yet. Add questions
                through the Exam Builder.
              </p>

              <button
                type="button"
                className="questions-btn questions-btn-primary"
                onClick={() =>
                  navigate(
                    `/admin/exams/create`
                  )
                }
              >
                Go to Exam Builder
              </button>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="questions-empty-state compact">
              <div className="questions-empty-icon">
                ⌕
              </div>

              <h3>No matching questions</h3>

              <p>
                Try changing your search or section
                filter.
              </p>
            </div>
          ) : (
            <div className="questions-sections">
              {Object.keys(filteredGroupedQuestions)
                .sort((a, b) => {
                  const sectionA =
                    sectionMap[a]?.order ?? 999;
                  const sectionB =
                    sectionMap[b]?.order ?? 999;

                  return sectionA - sectionB;
                })
                .map((sectionId) => {
                  const section =
                    sectionMap[sectionId];

                  const sectionQuestions =
                    filteredGroupedQuestions[
                      sectionId
                    ];

                  return (
                    <div
                      className="questions-section"
                      key={sectionId}
                    >
                      {/* SECTION HEADER */}
                      <div className="questions-section-header">
                        <div>
                          <div className="questions-section-kicker">
                            SECTION{" "}
                            {section?.order || ""}
                          </div>

                          <h3>
                            {section?.name ||
                              "Unassigned Questions"}
                          </h3>

                          {section && (
                            <p>
                              {section.category}{" "}
                              ·{" "}
                              {
                                section.selectionMode
                              }{" "}
                              ·{" "}
                              {section.marksPerQuestion}{" "}
                              mark
                              {Number(
                                section.marksPerQuestion
                              ) !== 1
                                ? "s"
                                : ""}{" "}
                              per question
                            </p>
                          )}
                        </div>

                        <div className="questions-section-count">
                          {
                            sectionQuestions.length
                          }{" "}
                          Questions
                        </div>
                      </div>

                      {/* QUESTIONS */}
                      <div className="questions-list">
                        {sectionQuestions.map(
                          (question, index) => (
                            <article
                              className="exam-question-card"
                              key={question._id}
                            >
                              <div className="exam-question-number">
                                {question.order ||
                                  index + 1}
                              </div>

                              <div className="exam-question-content">
                                <div className="exam-question-top">
                                  <span className="exam-question-label">
                                    QUESTION{" "}
                                    {question.order ||
                                      index + 1}
                                  </span>

                                  <span className="exam-question-marks">
                                    {question.marks}{" "}
                                    mark
                                    {Number(
                                      question.marks
                                    ) !== 1
                                      ? "s"
                                      : ""}
                                  </span>
                                </div>

                                <h4>
                                  {
                                    question.questionText
                                  }
                                </h4>

                                <div className="exam-question-options">
                                  {(
                                    question.options ||
                                    []
                                  ).map(
                                    (
                                      option,
                                      optionIndex
                                    ) => {
                                      const isCorrect =
                                        Number(
                                          question.correctAnswer
                                        ) ===
                                        optionIndex;

                                      return (
                                        <div
                                          className={`exam-option ${
                                            isCorrect
                                              ? "exam-option-correct"
                                              : ""
                                          }`}
                                          key={
                                            optionIndex
                                          }
                                        >
                                          <span className="exam-option-letter">
                                            {
                                              [
                                                "A",
                                                "B",
                                                "C",
                                                "D",
                                              ][
                                                optionIndex
                                              ]
                                            }
                                          </span>

                                          <span className="exam-option-text">
                                            {option}
                                          </span>

                                          {isCorrect && (
                                            <span className="exam-option-check">
                                              ✓ Correct
                                            </span>
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>

                                <div className="exam-question-meta">
                                  <span>
                                    Correct Answer:{" "}
                                    <strong>
                                      {getCorrectOptionLabel(
                                        question.correctAnswer
                                      )}
                                    </strong>
                                  </span>

                                  {question.sourceQuestion && (
                                    <span>
                                      Source: Question
                                      Bank
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="exam-question-actions">
                                <button
                                  type="button"
                                  className="question-action-edit"
                                  onClick={() =>
                                    openQuestionEditor(
                                      question
                                    )
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="question-action-delete"
                                  onClick={() =>
                                    handleDeleteQuestion(
                                      question
                                    )
                                  }
                                  disabled={
                                    deletingQuestionId ===
                                    question._id
                                  }
                                >
                                  {deletingQuestionId ===
                                  question._id
                                    ? "Removing..."
                                    : "Remove"}
                                </button>
                              </div>
                            </article>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      </div>

      {/* ======================================================
          EDIT EXAM MODAL
      ====================================================== */}
      {showExamModal && (
        <div
          className="questions-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowExamModal(false);
            }
          }}
        >
          <div className="questions-modal questions-exam-modal">
            <div className="questions-modal-header">
              <div>
                <div className="questions-card-kicker">
                  EXAM SETTINGS
                </div>

                <h2>Edit Exam</h2>

                <p>
                  Update the basic details of this
                  examination.
                </p>
              </div>

              <button
                type="button"
                className="questions-modal-close"
                onClick={() =>
                  setShowExamModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveExam}>
              <div className="questions-modal-body">
                <div className="questions-form-field full">
                  <label>Exam Title</label>

                  <input
                    type="text"
                    name="title"
                    value={examForm.title}
                    onChange={handleExamChange}
                    placeholder="Enter exam title"
                    required
                  />
                </div>

                <div className="questions-form-field full">
                  <label>Description</label>

                  <textarea
                    name="description"
                    value={examForm.description}
                    onChange={handleExamChange}
                    placeholder="Enter exam description"
                    rows="4"
                  />
                </div>

                <div className="questions-form-grid">
                  <div className="questions-form-field">
                    <label>Duration (minutes)</label>

                    <input
                      type="number"
                      name="duration"
                      min="1"
                      value={examForm.duration}
                      onChange={handleExamChange}
                      required
                    />
                  </div>

                  <div className="questions-form-field">
                    <label>Start Date & Time</label>

                    <input
                      type="datetime-local"
                      name="startDate"
                      value={examForm.startDate}
                      onChange={handleExamChange}
                      required
                    />
                  </div>

                  <div className="questions-form-field full">
                    <label>End Date & Time</label>

                    <input
                      type="datetime-local"
                      name="endDate"
                      value={examForm.endDate}
                      onChange={handleExamChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="questions-modal-footer">
                <button
                  type="button"
                  className="questions-btn questions-btn-secondary"
                  onClick={() =>
                    setShowExamModal(false)
                  }
                  disabled={savingExam}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="questions-btn questions-btn-primary"
                  disabled={savingExam}
                >
                  {savingExam
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          EDIT QUESTION MODAL
      ====================================================== */}
      {showQuestionModal && editingQuestion && (
        <div
          className="questions-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowQuestionModal(false);
            }
          }}
        >
          <div className="questions-modal questions-question-modal">
            <div className="questions-modal-header">
              <div>
                <div className="questions-card-kicker">
                  QUESTION EDITOR
                </div>

                <h2>Edit Question</h2>

                <p>
                  Changes apply only to this exam
                  question.
                </p>
              </div>

              <button
                type="button"
                className="questions-modal-close"
                onClick={() =>
                  setShowQuestionModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveQuestion}>
              <div className="questions-modal-body">
                <div className="questions-editor-note">
                  <strong>Exam-specific question</strong>
                  <span>
                    Editing this snapshot will not
                    modify the original Question Bank
                    entry.
                  </span>
                </div>

                <div className="questions-form-field full">
                  <label>Question</label>

                  <textarea
                    value={
                      questionForm.questionText
                    }
                    onChange={
                      handleQuestionTextChange
                    }
                    placeholder="Enter question"
                    rows="4"
                    required
                  />
                </div>

                <div className="questions-options-editor">
                  <div className="questions-editor-section-title">
                    Answer Options
                  </div>

                  {questionForm.options.map(
                    (option, index) => (
                      <div
                        className="questions-option-editor"
                        key={index}
                      >
                        <span className="questions-option-editor-letter">
                          {
                            ["A", "B", "C", "D"][
                              index
                            ]
                          }
                        </span>

                        <input
                          type="text"
                          value={option}
                          onChange={(event) =>
                            handleQuestionOptionChange(
                              index,
                              event.target.value
                            )
                          }
                          placeholder={`Option ${
                            ["A", "B", "C", "D"][
                              index
                            ]
                          }`}
                          required
                        />
                      </div>
                    )
                  )}
                </div>

                <div className="questions-form-grid">
                  <div className="questions-form-field">
                    <label>Correct Answer</label>

                    <select
                      value={
                        questionForm.correctAnswer
                      }
                      onChange={
                        handleCorrectAnswerChange
                      }
                    >
                      <option value={0}>
                        A
                      </option>
                      <option value={1}>
                        B
                      </option>
                      <option value={2}>
                        C
                      </option>
                      <option value={3}>
                        D
                      </option>
                    </select>
                  </div>

                  <div className="questions-form-field">
                    <label>Marks</label>

                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={questionForm.marks}
                      onChange={
                        handleQuestionMarksChange
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="questions-modal-footer">
                <button
                  type="button"
                  className="questions-btn questions-btn-secondary"
                  onClick={() =>
                    setShowQuestionModal(false)
                  }
                  disabled={savingQuestion}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="questions-btn questions-btn-primary"
                  disabled={savingQuestion}
                >
                  {savingQuestion
                    ? "Saving..."
                    : "Save Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminQuestions;