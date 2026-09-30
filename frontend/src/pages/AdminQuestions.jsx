import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import "./AdminQuestions.css";

function AdminQuestions() {
  const { examId } = useParams();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [marks, setMarks] = useState("");

  const [creating, setCreating] = useState(false);

  const [success, setSuccess] = useState("");
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [deletingQuestionId, setDeletingQuestionId] = useState(null);

  // =========================
  // FETCH QUESTIONS
  // =========================

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/questions/exam/${examId}`);

      setQuestions(response.data.questions);
    } catch (error) {
      console.error("Fetch questions error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load questions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [examId]);

  // =========================
  // CREATE QUESTION
  // =========================

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];

    updatedOptions[index] = value;

    setOptions(updatedOptions);
  };

  const handleCreateQuestion = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const response = await api.post("/questions", {
        exam: examId,
        questionText,
        options,
        correctAnswer: Number(correctAnswer),
        marks: Number(marks),
      });

      console.log("Question created:", response.data);

      setSuccess("Question created successfully.");

      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      setMarks("");

      await fetchQuestions();
    } catch (error) {
      console.error("Create question error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to create question"
      );
    } finally {
      setCreating(false);
    }
  };

  // =========================
  // DELETE QUESTION
  // =========================

  const handleDeleteQuestion = async (questionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this question?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingQuestionId(questionId);
      setError("");
      setSuccess("");

      await api.delete(`/questions/${questionId}`);

      setSuccess("Question deleted successfully.");

      await fetchQuestions();
    } catch (error) {
      console.error("Delete question error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to delete question"
      );
    } finally {
      setDeletingQuestionId(null);
    }
  };

  // =========================
  // EDIT QUESTION
  // =========================

  const handleEditOptionChange = (index, value) => {
    setEditingQuestion((currentQuestion) => {
      const updatedOptions = [...currentQuestion.options];

      updatedOptions[index] = value;

      return {
        ...currentQuestion,
        options: updatedOptions,
      };
    });
  };

  const handleUpdateQuestion = async (event) => {
    event.preventDefault();

    try {
      setError("");
      setSuccess("");

      await api.patch(
        `/questions/${editingQuestion._id}`,
        {
          questionText:
            editingQuestion.questionText,

          options:
            editingQuestion.options,

          correctAnswer: Number(
            editingQuestion.correctAnswer
          ),

          marks: Number(
            editingQuestion.marks
          ),
        }
      );

      setSuccess("Question updated successfully.");

      setEditingQuestion(null);

      await fetchQuestions();
    } catch (error) {
      console.error("Update question error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to update question"
      );
    }
  };

  return (
    <div className="admin-questions-page">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <header className="questions-page-header">

        <div>
          <p className="questions-eyebrow">
            EXAMINATION
          </p>

          <h1>Question Management</h1>

          <p>
            Create, review, edit, and manage questions for this examination.
          </p>
        </div>

        <div className="question-count">
          <span>Total Questions</span>
          <strong>{questions.length}</strong>
        </div>

      </header>

      {/* =========================
          NOTIFICATIONS
      ========================= */}

      {success && (
        <div className="question-notification success">

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
        <div className="question-notification error">

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
          ADD QUESTION
      ========================= */}

      <section className="question-management-card">

        <div className="question-card-header">

          <div>
            <h2>Add Question</h2>

            <p>
              Create a multiple-choice question with four answer options.
            </p>
          </div>

          <span className="question-header-label">
            NEW QUESTION
          </span>

        </div>

        <form
          className="question-form"
          onSubmit={handleCreateQuestion}
        >

          {/* Question */}

          <div className="question-field full-width">

            <label htmlFor="question-text">
              Question
            </label>

            <textarea
              id="question-text"
              value={questionText}
              onChange={(event) =>
                setQuestionText(event.target.value)
              }
              placeholder="Enter the question"
              required
              rows="4"
            />

          </div>

          {/* Options */}

          <div className="options-section">

            <div className="options-section-heading">
              <div>
                <h3>Answer Options</h3>
                <p>Select the correct option below.</p>
              </div>
            </div>

            <div className="options-grid">

              {options.map((option, index) => (
                <div
                  className="question-field"
                  key={index}
                >

                  <label htmlFor={`option-${index}`}>
                    Option {String.fromCharCode(65 + index)}
                  </label>

                  <input
                    id={`option-${index}`}
                    type="text"
                    value={option}
                    onChange={(event) =>
                      handleOptionChange(
                        index,
                        event.target.value
                      )
                    }
                    placeholder={`Enter option ${String.fromCharCode(
                      65 + index
                    )}`}
                    required
                  />

                </div>
              ))}

            </div>

          </div>

          {/* Correct Answer + Marks */}

          <div className="question-meta-grid">

            <div className="question-field">

              <label htmlFor="correct-answer">
                Correct Answer
              </label>

              <select
                id="correct-answer"
                value={correctAnswer}
                onChange={(event) =>
                  setCorrectAnswer(event.target.value)
                }
                required
              >

                <option value="">
                  Select correct answer
                </option>

                <option value="0">
                  Option A
                </option>

                <option value="1">
                  Option B
                </option>

                <option value="2">
                  Option C
                </option>

                <option value="3">
                  Option D
                </option>

              </select>

            </div>

            <div className="question-field">

              <label htmlFor="question-marks">
                Marks
              </label>

              <input
                id="question-marks"
                type="number"
                min="1"
                value={marks}
                onChange={(event) =>
                  setMarks(event.target.value)
                }
                placeholder="Enter marks"
                required
              />

            </div>

          </div>

          {/* Submit */}

          <div className="question-form-footer">

            <button
              type="submit"
              className="primary-question-button"
              disabled={creating}
            >

              {creating ? (
                <>
                  <span className="question-button-spinner"></span>
                  Adding...
                </>
              ) : (
                "Add Question"
              )}

            </button>

          </div>

        </form>

      </section>

      {/* =========================
          EDIT QUESTION
      ========================= */}

      {editingQuestion && (
        <section className="question-management-card edit-question-card">

          <div className="question-card-header">

            <div>
              <h2>Edit Question</h2>

              <p>
                Update the question, answer options, correct answer, or marks.
              </p>
            </div>

            <span className="question-header-label edit-label">
              EDIT MODE
            </span>

          </div>

          <form
            className="question-form"
            onSubmit={handleUpdateQuestion}
          >

            <div className="question-field full-width">

              <label htmlFor="edit-question-text">
                Question
              </label>

              <textarea
                id="edit-question-text"
                value={editingQuestion.questionText}
                onChange={(event) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    questionText:
                      event.target.value,
                  })
                }
                required
                rows="4"
              />

            </div>

            <div className="options-section">

              <div className="options-section-heading">
                <div>
                  <h3>Answer Options</h3>
                  <p>Update the four available answers.</p>
                </div>
              </div>

              <div className="options-grid">

                {editingQuestion.options.map(
                  (option, index) => (
                    <div
                      className="question-field"
                      key={index}
                    >

                      <label
                        htmlFor={`edit-option-${index}`}
                      >
                        Option{" "}
                        {String.fromCharCode(65 + index)}
                      </label>

                      <input
                        id={`edit-option-${index}`}
                        type="text"
                        value={option}
                        onChange={(event) =>
                          handleEditOptionChange(
                            index,
                            event.target.value
                          )
                        }
                        required
                      />

                    </div>
                  )
                )}

              </div>

            </div>

            <div className="question-meta-grid">

              <div className="question-field">

                <label htmlFor="edit-correct-answer">
                  Correct Answer
                </label>

                <select
                  id="edit-correct-answer"
                  value={editingQuestion.correctAnswer}
                  onChange={(event) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      correctAnswer:
                        event.target.value,
                    })
                  }
                  required
                >

                  <option value="0">
                    Option A
                  </option>

                  <option value="1">
                    Option B
                  </option>

                  <option value="2">
                    Option C
                  </option>

                  <option value="3">
                    Option D
                  </option>

                </select>

              </div>

              <div className="question-field">

                <label htmlFor="edit-question-marks">
                  Marks
                </label>

                <input
                  id="edit-question-marks"
                  type="number"
                  min="1"
                  value={editingQuestion.marks}
                  onChange={(event) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      marks: event.target.value,
                    })
                  }
                  required
                />

              </div>

            </div>

            <div className="question-form-footer edit-actions">

              <button
                type="submit"
                className="primary-question-button"
              >
                Save Changes
              </button>

              <button
                type="button"
                className="secondary-question-button"
                onClick={() =>
                  setEditingQuestion(null)
                }
              >
                Cancel
              </button>

            </div>

          </form>

        </section>
      )}

      {/* =========================
          QUESTION LIST
      ========================= */}

      <section className="question-management-card question-list-card">

        <div className="question-card-header">

          <div>
            <h2>Questions</h2>

            <p>
              Review and manage all questions belonging to this examination.
            </p>
          </div>

          {!loading && questions.length > 0 && (
            <span className="question-list-count">
              {questions.length}{" "}
              {questions.length === 1
                ? "Question"
                : "Questions"}
            </span>
          )}

        </div>

        {loading ? (
          <div className="question-state">

            <span className="loading-spinner"></span>

            <p>Loading questions...</p>

          </div>
        ) : error ? (
          <div className="question-state error-state">

            <h3>Unable to load questions</h3>

            <p>{error}</p>

            <button
              type="button"
              className="secondary-question-button"
              onClick={fetchQuestions}
            >
              Try Again
            </button>

          </div>
        ) : questions.length === 0 ? (
          <div className="question-state">

            <div className="empty-question-mark">
              Q
            </div>

            <h3>No questions found</h3>

            <p>
              Add your first question using the form above.
            </p>

          </div>
        ) : (
          <div className="questions-list">

            {questions.map((question, index) => (

              <article
                key={question._id}
                className="question-item"
              >

                <div className="question-item-header">

                  <div className="question-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="question-item-heading">

                    <span>
                      QUESTION {index + 1}
                    </span>

                    <strong>
                      {question.marks}{" "}
                      {question.marks === 1
                        ? "Mark"
                        : "Marks"}
                    </strong>

                  </div>

                </div>

                <div className="question-item-content">

                  <p className="question-text">
                    {question.questionText}
                  </p>

                  <div className="question-options">

                    {question.options.map(
                      (option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={
                            optionIndex ===
                            Number(
                              question.correctAnswer
                            )
                              ? "question-option correct"
                              : "question-option"
                          }
                        >

                          <span className="option-letter">
                            {String.fromCharCode(
                              65 + optionIndex
                            )}
                          </span>

                          <span>
                            {option}
                          </span>

                          {optionIndex ===
                            Number(
                              question.correctAnswer
                            ) && (
                            <span className="correct-label">
                              Correct
                            </span>
                          )}

                        </div>
                      )
                    )}

                  </div>

                </div>

                <div className="question-item-footer">

                  <button
                    type="button"
                    className="question-action edit"
                    onClick={() =>
                      setEditingQuestion({
                        ...question,
                      })
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="question-action delete"
                    onClick={() =>
                      handleDeleteQuestion(
                        question._id
                      )
                    }
                    disabled={
                      deletingQuestionId ===
                      question._id
                    }
                  >
                    {deletingQuestionId ===
                    question._id
                      ? "Deleting..."
                      : "Delete"}
                  </button>

                </div>

              </article>

            ))}

          </div>
        )}

      </section>

    </div>
  );
}

export default AdminQuestions;