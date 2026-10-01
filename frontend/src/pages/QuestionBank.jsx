import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./QuestionBank.css";

function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [difficulty, setDifficulty] = useState("ALL");

  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/questions/bank");

      setQuestions(response.data.questions || []);
    } catch (err) {
      console.error("Question bank error:", err);
      setError(
        err.response?.data?.message || "Failed to load question bank"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const categories = useMemo(() => {
    return [
      ...new Set(
        questions
          .map((question) => question.category)
          .filter(Boolean)
      ),
    ].sort();
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return questions.filter((question) => {
      const matchesSearch =
        !searchText ||
        question.questionText?.toLowerCase().includes(searchText);

      const matchesCategory =
        category === "ALL" || question.category === category;

      const matchesDifficulty =
        difficulty === "ALL" ||
        question.difficulty === difficulty;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDifficulty
      );
    });
  }, [questions, search, category, difficulty]);

  const handleDelete = async (questionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this question?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/questions/${questionId}`);

      setSuccess("Question removed successfully.");
      fetchQuestions();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to remove question"
      );
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please select an Excel file.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");
      setUploadResult(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        "/questions/bulk-upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadResult(response.data);

      setSuccess("Question upload completed.");
      setFile(null);

      await fetchQuestions();
    } catch (err) {
      console.error("Question upload error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to upload questions"
      );
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers =
      "Question,Option A,Option B,Option C,Option D,Correct Option,Category,Difficulty";

    const sample =
      '"What is 2 + 2?","2","3","4","5","C","Aptitude","EASY"';

    const blob = new Blob(
      [`${headers}\n${sample}`],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "question-bank-template.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("ALL");
    setDifficulty("ALL");
  };

  return (
    <div className="question-bank-page">

      <div className="question-bank-header">
        <div>
          <p className="page-eyebrow">ADMINISTRATION</p>
          <h1>Question Bank</h1>
          <p className="page-description">
            Manage reusable questions for aptitude, technical,
            coding and other examinations.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setShowUpload(true);
            setError("");
            setSuccess("");
            setUploadResult(null);
          }}
        >
          Bulk Upload
        </button>
      </div>

      {success && (
        <div className="alert success-alert">
          {success}
        </div>
      )}

      {error && (
        <div className="alert error-alert">
          {error}
        </div>
      )}

      <div className="question-bank-stats">
        <div className="stat-card">
          <span>Total Questions</span>
          <strong>{questions.length}</strong>
        </div>

        <div className="stat-card">
          <span>Filtered Questions</span>
          <strong>{filteredQuestions.length}</strong>
        </div>

        <div className="stat-card">
          <span>Categories</span>
          <strong>{categories.length}</strong>
        </div>

        <div className="stat-card">
          <span>Hard Questions</span>
          <strong>
            {
              questions.filter(
                (question) => question.difficulty === "HARD"
              ).length
            }
          </strong>
        </div>
      </div>

      <div className="question-bank-card">

        <div className="filter-header">
          <div>
            <h2>Question Library</h2>
            <p>
              Search and filter questions available for exam creation.
            </p>
          </div>
        </div>

        <div className="question-filters">

          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="ALL">All Categories</option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value)
            }
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <button
            className="secondary-button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            Loading question bank...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="empty-state">
            <h3>No questions found</h3>
            <p>
              Upload questions or change your filters.
            </p>
          </div>
        ) : (
          <div className="question-table-wrapper">
            <table className="question-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Category</th>
                  <th>Difficulty</th>
                  <th>Correct Answer</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredQuestions.map((question, index) => (
                  <tr key={question._id}>

                    <td>{index + 1}</td>

                    <td>
                      <div className="question-cell">
                        <strong>
                          {question.questionText}
                        </strong>

                        <div className="options-preview">
                          {question.options?.map(
                            (option, optionIndex) => (
                              <span
                                key={optionIndex}
                                className={
                                  optionIndex ===
                                  question.correctAnswer
                                    ? "correct-option"
                                    : ""
                                }
                              >
                                {String.fromCharCode(
                                  65 + optionIndex
                                )}
                                . {option}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="category-badge">
                        {question.category}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`difficulty-badge ${question.difficulty?.toLowerCase()}`}
                      >
                        {question.difficulty}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {String.fromCharCode(
                          65 + question.correctAnswer
                        )}
                      </strong>
                    </td>

                    <td>
                      <button
                        className="delete-button"
                        onClick={() =>
                          handleDelete(question._id)
                        }
                      >
                        Remove
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>

      {showUpload && (
        <div className="modal-overlay">

          <div className="upload-modal">

            <div className="modal-header">
              <div>
                <p className="page-eyebrow">QUESTION BANK</p>
                <h2>Bulk Upload Questions</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowUpload(false)}
              >
                ×
              </button>
            </div>

            <div className="upload-info">
              <p>
                Upload an Excel file containing multiple-choice
                questions.
              </p>

              <button
                className="template-button"
                onClick={downloadTemplate}
              >
                Download Template
              </button>
            </div>

            <div className="upload-columns">
              <span>Question</span>
              <span>Option A</span>
              <span>Option B</span>
              <span>Option C</span>
              <span>Option D</span>
              <span>Correct Option</span>
              <span>Category</span>
              <span>Difficulty</span>
            </div>

            <form onSubmit={handleUpload}>

              <label className="file-dropzone">

                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(event) =>
                    setFile(event.target.files?.[0] || null)
                  }
                />

                <strong>
                  {file
                    ? file.name
                    : "Choose an Excel file"}
                </strong>

                <span>
                  Supported formats: .xlsx and .xls
                </span>

              </label>

              {uploadResult && (
                <div className="upload-result">

                  <div>
                    <span>Total</span>
                    <strong>
                      {uploadResult.total ?? 0}
                    </strong>
                  </div>

                  <div>
                    <span>Created</span>
                    <strong>
                      {uploadResult.created ?? 0}
                    </strong>
                  </div>

                  <div>
                    <span>Skipped</span>
                    <strong>
                      {uploadResult.skipped ?? 0}
                    </strong>
                  </div>

                </div>
              )}

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowUpload(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={uploading}
                >
                  {uploading
                    ? "Uploading..."
                    : "Upload Questions"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default QuestionBank;