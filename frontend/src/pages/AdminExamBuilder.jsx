import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminExamBuilder.css";

function AdminExamBuilder() {
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [sections, setSections] = useState([]);

  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [creatingExam, setCreatingExam] = useState(false);
  const [creatingSection, setCreatingSection] = useState(false);
  const [generatingSection, setGeneratingSection] = useState("");
  const [viewingSection, setViewingSection] = useState(null);

  // Manual question selection
  const [manualSearch, setManualSearch] = useState("");
  const [selectedManualQuestions, setSelectedManualQuestions] = useState([]);

  const [sectionQuestions, setSectionQuestions] = useState([]);
  const [loadingSectionQuestions, setLoadingSectionQuestions] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [publishing, setPublishing] = useState(false);

  const [examForm, setExamForm] = useState({
    title: "",
    description: "",
    duration: 60,
    totalMarks: 100,
    startDate: "",
    endDate: "",
  });

  const [sectionForm, setSectionForm] = useState({
    name: "",
    category: "",
    questionCount: 10,
    marksPerQuestion: 1,
    selectionMode: "RANDOM",
    difficulty: "ANY",
  });

  // --------------------------------------------------
  // FETCH QUESTION BANK
  // --------------------------------------------------

  const fetchQuestions = async () => {
    try {
      setLoadingQuestions(true);
      setError("");

      const response = await api.get("/questions/bank");

      setQuestions(response.data.questions || []);
    } catch (err) {
      console.error("Fetch Question Bank error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load Question Bank"
      );
    } finally {
      setLoadingQuestions(false);
    }
  };

  // --------------------------------------------------
  // FETCH EXAM SECTIONS
  // --------------------------------------------------

  const fetchSections = async (examId) => {
    try {
      const response = await api.get(
        `/exam-sections/exam/${examId}`
      );

      setSections(response.data.sections || []);
    } catch (err) {
      console.error("Fetch sections error:", err);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // --------------------------------------------------
  // QUESTION CATEGORIES
  // --------------------------------------------------

  const categories = useMemo(() => {
    return [
      ...new Set(
        questions
          .map((question) => question.category)
          .filter(Boolean)
      ),
    ].sort();
  }, [questions]);

  // --------------------------------------------------
  // MATCHING QUESTION COUNT
  // --------------------------------------------------

  const matchingQuestionCount = useMemo(() => {
    if (!sectionForm.category) return 0;

    const selectedCategory =
      sectionForm.category.trim().toLowerCase();

    const selectedDifficulty =
      sectionForm.difficulty.trim().toUpperCase();

    return questions.filter((question) => {
      const questionCategory = String(
        question.category || ""
      )
        .trim()
        .toLowerCase();

      const questionDifficulty = String(
        question.difficulty || ""
      )
        .trim()
        .toUpperCase();

      const categoryMatch =
        questionCategory === selectedCategory;

      const difficultyMatch =
        selectedDifficulty === "ANY" ||
        questionDifficulty === selectedDifficulty;

      return categoryMatch && difficultyMatch;
    }).length;
  }, [
    questions,
    sectionForm.category,
    sectionForm.difficulty,
  ]);

  // --------------------------------------------------
  // MANUAL QUESTION LIST
  // --------------------------------------------------

  const manualQuestions = useMemo(() => {
    const search = manualSearch.trim().toLowerCase();

    const category =
      sectionForm.category.trim().toLowerCase();

    const difficulty =
      sectionForm.difficulty.trim().toUpperCase();

    return questions.filter((question) => {
      const questionCategory = String(
        question.category || ""
      )
        .trim()
        .toLowerCase();

      const questionDifficulty = String(
        question.difficulty || ""
      )
        .trim()
        .toUpperCase();

      const categoryMatch =
        !category || questionCategory === category;

      const difficultyMatch =
        difficulty === "ANY" ||
        questionDifficulty === difficulty;

      const searchMatch =
        !search ||
        String(question.questionText || "")
          .toLowerCase()
          .includes(search) ||
        question.options?.some((option) =>
          String(option)
            .toLowerCase()
            .includes(search)
        );

      return (
        categoryMatch &&
        difficultyMatch &&
        searchMatch
      );
    });
  }, [
    questions,
    manualSearch,
    sectionForm.category,
    sectionForm.difficulty,
  ]);

  // --------------------------------------------------
  // FORM HANDLERS
  // --------------------------------------------------

  const handleExamChange = (event) => {
    const { name, value } = event.target;

    setExamForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSectionChange = (event) => {
    const { name, value } = event.target;

    setSectionForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear manual selection when category/difficulty/count changes
    if (
      name === "category" ||
      name === "difficulty" ||
      name === "questionCount"
    ) {
      setSelectedManualQuestions([]);
      setManualSearch("");
    }
  };

  // --------------------------------------------------
  // CREATE EXAM
  // --------------------------------------------------

  const createExam = async (event) => {
    event.preventDefault();

    try {
      setCreatingExam(true);
      setError("");
      setSuccess("");

      const response = await api.post("/exams", {
        title: examForm.title,
        description: examForm.description,
        duration: Number(examForm.duration),
        totalMarks: Number(examForm.totalMarks),
        startDate: examForm.startDate,
        endDate: examForm.endDate,
      });

      const createdExam = response.data.exam;

      setExam(createdExam);

      setSuccess(
        "Exam created. You can now add sections."
      );
    } catch (err) {
      console.error("Create exam error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to create exam"
      );
    } finally {
      setCreatingExam(false);
    }
  };

  // --------------------------------------------------
  // MANUAL QUESTION SELECT / UNSELECT
  // --------------------------------------------------

  const toggleManualQuestion = (questionId) => {
    setSelectedManualQuestions((previous) => {
      // Remove
      if (previous.includes(questionId)) {
        return previous.filter(
          (id) => id !== questionId
        );
      }

      // Maximum selection reached
      if (
        previous.length >=
        Number(sectionForm.questionCount)
      ) {
        setError(
          `You can select only ${sectionForm.questionCount} questions.`
        );

        return previous;
      }

      setError("");

      return [...previous, questionId];
    });
  };

  // --------------------------------------------------
  // CREATE SECTION
  // --------------------------------------------------

  const createSection = async (event) => {
    event.preventDefault();

    if (!exam) {
      setError("Create the exam first.");
      return;
    }

    if (!sectionForm.name.trim()) {
      setError("Please enter a section name.");
      return;
    }

    if (!sectionForm.category) {
      setError(
        "Please select a question category."
      );
      return;
    }

    const questionCount = Number(
      sectionForm.questionCount
    );

    if (questionCount < 1) {
      setError(
        "Question count must be at least 1."
      );
      return;
    }

    if (questionCount > matchingQuestionCount) {
      setError(
        `Only ${matchingQuestionCount} matching questions are available.`
      );
      return;
    }

    // Manual validation
    if (
      sectionForm.selectionMode === "MANUAL"
    ) {
      if (
        selectedManualQuestions.length !==
        questionCount
      ) {
        setError(
          `Select exactly ${questionCount} questions. You currently selected ${selectedManualQuestions.length}.`
        );
        return;
      }
    }

    try {
      setCreatingSection(true);
      setError("");
      setSuccess("");

      // ------------------------------------------
      // 1. CREATE SECTION
      // ------------------------------------------

      const response = await api.post(
        `/exam-sections/exam/${exam._id}`,
        {
          name: sectionForm.name.trim(),
          category: sectionForm.category,
          questionCount,
          marksPerQuestion: Number(
            sectionForm.marksPerQuestion
          ),
          selectionMode:
            sectionForm.selectionMode,
          difficulty: sectionForm.difficulty,
          order: sections.length + 1,
        }
      );

      const newSection =
        response.data.section;

      // ------------------------------------------
      // 2. MANUAL QUESTION SELECTION
      // ------------------------------------------

      if (
        sectionForm.selectionMode === "MANUAL"
      ) {
        const manualResponse =
          await api.post(
            `/exam-questions/section/${newSection._id}/manual`,
            {
              questionIds:
                selectedManualQuestions,
            }
          );

        setSuccess(
          `${manualResponse.data.count} selected questions added to "${newSection.name}".`
        );
      } else {
        setSuccess(
          "Section created. Generate its random questions."
        );
      }

      // ------------------------------------------
      // 3. REFRESH SECTIONS
      // ------------------------------------------

      await fetchSections(exam._id);

      // ------------------------------------------
      // 4. RESET SECTION FORM
      // ------------------------------------------

      setSectionForm({
        name: "",
        category: "",
        questionCount: 10,
        marksPerQuestion: 1,
        selectionMode: "RANDOM",
        difficulty: "ANY",
      });

      setSelectedManualQuestions([]);
      setManualSearch("");
    } catch (err) {
      console.error(
        "Create section error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to create section"
      );
    } finally {
      setCreatingSection(false);
    }
  };

  // --------------------------------------------------
  // GENERATE RANDOM QUESTIONS
  // --------------------------------------------------

  const generateQuestions = async (sectionId) => {
    try {
      setGeneratingSection(sectionId);
      setError("");
      setSuccess("");

      const response = await api.post(
        `/exam-questions/section/${sectionId}/generate`
      );

      setSuccess(
        `${response.data.count} questions generated for the section.`
      );

      await fetchSections(exam._id);
    } catch (err) {
      console.error(
        "Generate questions error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to generate questions"
      );
    } finally {
      setGeneratingSection("");
    }
  };

  // --------------------------------------------------
  // DELETE SECTION
  // --------------------------------------------------

  const removeSection = async (sectionId) => {
    const confirmed = window.confirm(
      "Delete this section?"
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/exam-sections/${sectionId}`
      );

      setSections((previous) =>
        previous.filter(
          (section) =>
            section._id !== sectionId
        )
      );

      setSuccess("Section deleted.");
    } catch (err) {
      console.error(
        "Delete section error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete section"
      );
    }
  };

  // --------------------------------------------------
  // VIEW GENERATED QUESTIONS
  // --------------------------------------------------

  const viewQuestions = async (section) => {
    try {
      setViewingSection(section);
      setSectionQuestions([]);
      setLoadingSectionQuestions(true);
      setError("");

      const response = await api.get(
        `/exam-questions/section/${section._id}`
      );

      setSectionQuestions(
        response.data.questions || []
      );
    } catch (err) {
      console.error(
        "Fetch section questions error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load generated questions"
      );
    } finally {
      setLoadingSectionQuestions(false);
    }
  };

  // --------------------------------------------------
  // PUBLISH EXAM
  // --------------------------------------------------

  const publishExam = async () => {
    if (!exam) return;

    const confirmed = window.confirm(
      "Publish this exam? Once published, students can access it according to the exam schedule."
    );

    if (!confirmed) return;

    try {
      setPublishing(true);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/exams/${exam._id}/publish`,
        {
          isPublished: true,
        }
      );

      setExam(response.data.exam);

      setSuccess(
        "Exam published successfully."
      );
    } catch (err) {
      console.error(
        "Publish exam error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to publish exam"
      );
    } finally {
      setPublishing(false);
    }
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="exam-builder-page">
      {/* HEADER */}
      <div className="exam-builder-header">
        <div>
          <p className="page-eyebrow">
            EXAM MANAGEMENT
          </p>

          <h1>Create Examination</h1>

          <p>
            Create an exam and generate a fixed
            set of questions specifically for this
            examination.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate("/admin/exams")
          }
        >
          Back to Exams
        </button>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="builder-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="builder-alert success">
          {success}
        </div>
      )}

      {/* ==================================================
          CREATE EXAM
          ================================================== */}

      {!exam ? (
        <form
          className="builder-card"
          onSubmit={createExam}
        >
          <div className="builder-card-header">
            <div>
              <h2>Exam Details</h2>

              <p>
                Define the basic information for
                this examination.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field full-width">
              <label>Exam Title</label>

              <input
                name="title"
                value={examForm.title}
                onChange={handleExamChange}
                placeholder="Example: Technical Assessment 2026"
                required
              />
            </div>

            <div className="form-field full-width">
              <label>Description</label>

              <textarea
                name="description"
                value={examForm.description}
                onChange={handleExamChange}
                placeholder="Enter examination description"
                rows="4"
              />
            </div>

            <div className="form-field">
              <label>
                Duration (minutes)
              </label>

              <input
                type="number"
                name="duration"
                min="1"
                value={examForm.duration}
                onChange={handleExamChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Total Marks</label>

              <input
                type="number"
                name="totalMarks"
                min="1"
                value={examForm.totalMarks}
                onChange={handleExamChange}
                required
              />
            </div>

            <div className="form-field">
              <label>
                Start Date & Time
              </label>

              <input
                type="datetime-local"
                name="startDate"
                value={examForm.startDate}
                onChange={handleExamChange}
                required
              />
            </div>

            <div className="form-field">
              <label>
                End Date & Time
              </label>

              <input
                type="datetime-local"
                name="endDate"
                value={examForm.endDate}
                onChange={handleExamChange}
                required
              />
            </div>
          </div>

          <div className="builder-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={creatingExam}
            >
              {creatingExam
                ? "Creating..."
                : "Create Exam"}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* ==================================================
              EXAM SUMMARY
              ================================================== */}

          <div className="exam-summary-card">
            <div>
              <span>EXAM</span>

              <h2>{exam.title}</h2>

              <p>{exam.description}</p>
            </div>

            <div className="exam-summary-stats">
              <div>
                <span>Duration</span>
                <strong>
                  {exam.duration} min
                </strong>
              </div>

              <div>
                <span>Total Marks</span>
                <strong>
                  {exam.totalMarks}
                </strong>
              </div>

              <div>
                <span>Sections</span>
                <strong>
                  {sections.length}
                </strong>
              </div>
            </div>

            <div className="exam-publish-area">
              <span
                className={
                  exam.isPublished
                    ? "publish-status published"
                    : "publish-status draft"
                }
              >
                {exam.isPublished
                  ? "Published"
                  : "Draft"}
              </span>

              {!exam.isPublished && (
                <button
                  className="primary-button"
                  onClick={publishExam}
                  disabled={
                    publishing ||
                    sections.length === 0 ||
                    sections.some(
                      (section) =>
                        !section.questionsGenerated
                    )
                  }
                >
                  {publishing
                    ? "Publishing..."
                    : "Publish Exam"}
                </button>
              )}
            </div>
          </div>

          {/* ==================================================
              BUILDER LAYOUT
              ================================================== */}

          <div className="builder-layout">
            {/* ==================================================
                ADD SECTION
                ================================================== */}

            <div className="builder-card">
              <div className="builder-card-header">
                <div>
                  <h2>Add Section</h2>

                  <p>
                    Define which Question Bank
                    questions should be used for
                    this section.
                  </p>
                </div>
              </div>

              <form onSubmit={createSection}>
                <div className="form-grid">
                  {/* SECTION NAME */}
                  <div className="form-field">
                    <label>
                      Section Name
                    </label>

                    <input
                      name="name"
                      value={sectionForm.name}
                      onChange={handleSectionChange}
                      placeholder="Aptitude"
                      required
                    />
                  </div>

                  {/* CATEGORY */}
                  <div className="form-field">
                    <label>
                      Question Category
                    </label>

                    <select
                      name="category"
                      value={
                        sectionForm.category
                      }
                      onChange={
                        handleSectionChange
                      }
                      required
                    >
                      <option value="">
                        Select category
                      </option>

                      {categories.map(
                        (category) => (
                          <option
                            key={category}
                            value={category}
                          >
                            {category}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* QUESTION COUNT */}
                  <div className="form-field">
                    <label>
                      Number of Questions
                    </label>

                    <input
                      type="number"
                      name="questionCount"
                      min="1"
                      value={
                        sectionForm.questionCount
                      }
                      onChange={
                        handleSectionChange
                      }
                      required
                    />
                  </div>

                  {/* MARKS */}
                  <div className="form-field">
                    <label>
                      Marks / Question
                    </label>

                    <input
                      type="number"
                      name="marksPerQuestion"
                      min="1"
                      value={
                        sectionForm.marksPerQuestion
                      }
                      onChange={
                        handleSectionChange
                      }
                      required
                    />
                  </div>

                  {/* DIFFICULTY */}
                  <div className="form-field">
                    <label>
                      Difficulty
                    </label>

                    <select
                      name="difficulty"
                      value={
                        sectionForm.difficulty
                      }
                      onChange={
                        handleSectionChange
                      }
                    >
                      <option value="ANY">
                        Any Difficulty
                      </option>

                      <option value="EASY">
                        Easy
                      </option>

                      <option value="MEDIUM">
                        Medium
                      </option>

                      <option value="HARD">
                        Hard
                      </option>
                    </select>
                  </div>

                  {/* ==================================================
                      SELECTION METHOD
                      ================================================== */}

                  <div className="form-field full-width">
                    <label>
                      Question Selection Method
                    </label>

                    <div className="selection-method-wrapper">
  <div className="selection-method-heading">
    <span className="selection-method-title">
      Question Selection
    </span>

    <span className="selection-method-description">
      Choose how questions should be added to this section.
    </span>
  </div>

  <div className="selection-method-options">
    {/* RANDOM */}
    <button
      type="button"
      className={`selection-method-card ${
        sectionForm.selectionMode === "RANDOM"
          ? "active"
          : ""
      }`}
      onClick={() => {
        setSectionForm((previous) => ({
          ...previous,
          selectionMode: "RANDOM",
        }));

        setSelectedManualQuestions([]);
        setManualSearch("");
        setError("");
      }}
    >
      <div className="selection-method-icon">
        <span>R</span>
      </div>

      <div className="selection-method-content">
        <strong>Random Selection</strong>

        <span>
          Automatically choose questions from the
          Question Bank.
        </span>
      </div>

      <div className="selection-method-check">
        {sectionForm.selectionMode === "RANDOM" && "✓"}
      </div>
    </button>

    {/* MANUAL */}
    <button
      type="button"
      className={`selection-method-card ${
        sectionForm.selectionMode === "MANUAL"
          ? "active"
          : ""
      }`}
      onClick={() => {
        setSectionForm((previous) => ({
          ...previous,
          selectionMode: "MANUAL",
        }));

        setSelectedManualQuestions([]);
        setManualSearch("");
        setError("");
      }}
    >
      <div className="selection-method-icon">
        <span>M</span>
      </div>

      <div className="selection-method-content">
        <strong>Manual Selection</strong>

        <span>
          Choose specific questions from the
          Question Bank yourself.
        </span>
      </div>

      <div className="selection-method-check">
        {sectionForm.selectionMode === "MANUAL" && "✓"}
      </div>
    </button>
  </div>
</div>

                    {/* ==================================================
                        MANUAL QUESTION BANK
                        ================================================== */}

                    {sectionForm.selectionMode === "MANUAL" && (
  <div className="manual-question-picker">
    <div className="manual-picker-header">
      <div>
        <h3>Select Questions</h3>
        <p>
          Choose exactly{" "}
          <strong>{sectionForm.questionCount}</strong>{" "}
          questions from the Question Bank.
        </p>
      </div>

      <div className="selected-question-count">
        {selectedManualQuestions.length} /{" "}
        {sectionForm.questionCount}
      </div>
    </div>

    <div className="manual-picker-toolbar">
      <div className="manual-search">
        <input
          type="text"
          value={manualSearch}
          onChange={(event) =>
            setManualSearch(event.target.value)
          }
          placeholder="Search questions..."
        />
      </div>

      <div className="manual-availability">
        {manualQuestions.length} questions available
      </div>
    </div>

    {loadingQuestions ? (
      <div className="manual-empty">
        Loading questions...
      </div>
    ) : manualQuestions.length === 0 ? (
      <div className="manual-empty">
        <strong>No matching questions found.</strong>
        <p>
          Try changing the category, difficulty, or
          search term.
        </p>
      </div>
    ) : (
      <div className="manual-question-list">
        {manualQuestions.map((question, index) => {
          const selected =
            selectedManualQuestions.includes(
              question._id
            );

          return (
            <div
              key={question._id}
              className={`manual-question-card ${
                selected ? "selected" : ""
              }`}
            >
              <div className="manual-question-select">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() =>
                    toggleManualQuestion(
                      question._id
                    )
                  }
                />
              </div>

              <div className="manual-question-body">
                <div className="manual-question-header">
                  <span className="manual-question-number">
                     {index + 1}
                  </span>

                  <div className="manual-question-tags">
                    <span className="question-category-tag">
                      {question.category}
                    </span>

                    <span className="question-difficulty-tag">
                      {question.difficulty}
                    </span>
                  </div>
                </div>

                <div className="manual-question-text">
                  {question.questionText}
                </div>

                <div className="manual-options">
                  {question.options?.map(
                    (option, optionIndex) => (
                      <div
                        className="manual-option"
                        key={optionIndex}
                      >
                        <span className="manual-option-letter">
                          {String.fromCharCode(
                            65 + optionIndex
                          )}
                        </span>

                        <span className="manual-option-text">
                          {option}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
                  </div>

                  {/* AVAILABLE QUESTIONS */}
                  <div className="availability-box">
                    <span>
                      Available Questions
                    </span>

                    <strong>
                      {loadingQuestions
                        ? "..."
                        : matchingQuestionCount}
                    </strong>
                  </div>
                </div>

                {/* ADD SECTION */}
                <div className="builder-actions">
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      creatingSection ||
                      !sectionForm.category ||
                      Number(
                        sectionForm.questionCount
                      ) >
                        matchingQuestionCount ||
                      (sectionForm.selectionMode ===
                        "MANUAL" &&
                        selectedManualQuestions.length !==
                          Number(
                            sectionForm.questionCount
                          ))
                    }
                  >
                    {creatingSection
                      ? "Adding..."
                      : "Add Section"}
                  </button>
                </div>
              </form>
            </div>

            {/* ==================================================
                EXAM SECTIONS
                ================================================== */}

            <div className="builder-card">
              <div className="builder-card-header">
                <div>
                  <h2>Exam Sections</h2>

                  <p>
                    Generate questions for each
                    section.
                  </p>
                </div>
              </div>

              {sections.length === 0 ? (
                <div className="builder-empty">
                  No sections added yet.
                </div>
              ) : (
                <div className="section-list">
                  {sections.map(
                    (section, index) => (
                      <div
                        className="section-item"
                        key={section._id}
                      >
                        <div className="section-number">
                          {index + 1}
                        </div>

                        <div className="section-content">
                          <div className="section-title-row">
                            <h3>
                              {section.name}
                            </h3>

                            <span
                              className={
                                section.questionsGenerated
                                  ? "status generated"
                                  : "status pending"
                              }
                            >
                              {section.questionsGenerated
                                ? "Questions Generated"
                                : "Questions Pending"}
                            </span>
                          </div>

                          <div className="section-details">
                            <span>
                              Category:{" "}
                              <strong>
                                {
                                  section.category
                                }
                              </strong>
                            </span>

                            <span>
                              Questions:{" "}
                              <strong>
                                {
                                  section.questionCount
                                }
                              </strong>
                            </span>

                            <span>
                              Marks:{" "}
                              <strong>
                                {
                                  section.marksPerQuestion
                                }
                              </strong>
                            </span>

                            <span>
                              Selection:{" "}
                              <strong>
                                {section.selectionMode ===
                                "MANUAL"
                                  ? "Manual"
                                  : "Random"}
                              </strong>
                            </span>
                          </div>

                          <div className="section-actions">
                            {/* RANDOM GENERATION */}
                            {!section.questionsGenerated &&
                              section.selectionMode ===
                                "RANDOM" && (
                                <button
                                  className="primary-button small"
                                  onClick={() =>
                                    generateQuestions(
                                      section._id
                                    )
                                  }
                                  disabled={
                                    generatingSection ===
                                    section._id
                                  }
                                >
                                  {generatingSection ===
                                  section._id
                                    ? "Generating..."
                                    : "Generate Questions"}
                                </button>
                              )}

                            {/* VIEW GENERATED/MANUAL QUESTIONS */}
                            {section.questionsGenerated && (
                              <button
                                className="secondary-button small"
                                onClick={() =>
                                  viewQuestions(
                                    section
                                  )
                                }
                              >
                                View Questions
                              </button>
                            )}

                            {/* DELETE */}
                            <button
                              className="delete-section-button"
                              onClick={() =>
                                removeSection(
                                  section._id
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ==================================================
          VIEW QUESTIONS MODAL
          ================================================== */}

      {viewingSection && (
        <div className="questions-modal-overlay">
          <div className="questions-modal">
            <div className="questions-modal-header">
              <div>
                <p className="page-eyebrow">
                  EXAM QUESTIONS
                </p>

                <h2>
                  {viewingSection.name}
                </h2>

                <p>
                  {viewingSection.questionCount}{" "}
                  questions
                  {" · "}
                  {
                    viewingSection.marksPerQuestion
                  }{" "}
                  mark/question
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => {
                  setViewingSection(null);
                  setSectionQuestions([]);
                }}
              >
                ×
              </button>
            </div>

            {loadingSectionQuestions ? (
              <div className="questions-loading">
                Loading questions...
              </div>
            ) : sectionQuestions.length ===
              0 ? (
              <div className="questions-loading">
                No questions found for this
                section.
              </div>
            ) : (
              <div className="generated-question-list">
                {sectionQuestions.map(
                  (question, index) => (
                    <div
                      className="generated-question"
                      key={question._id}
                    >
                      <div className="question-number">
                         {index + 1}
                      </div>

                      <h3>
                        {question.questionText}
                      </h3>

                      <div className="generated-options">
                        {question.options.map(
                          (
                            option,
                            optionIndex
                          ) => (
                            <div
                              key={optionIndex}
                              className={
                                optionIndex ===
                                question.correctAnswer
                                  ? "generated-option correct"
                                  : "generated-option"
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
                                  Correct
                                </strong>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminExamBuilder;