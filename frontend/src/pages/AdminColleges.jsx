import { useEffect, useState } from "react";
import api from "../services/api";
import "./AdminOrganizations.css";

function AdminColleges() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingCollege, setEditingCollege] =
    useState(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    location: "",
  });

  // ======================================================
  // LOAD COLLEGES
  // ======================================================

  const loadColleges = async () => {
    try {
      setLoading(true);

      const response = await api.get("/colleges");

      const data =
        response.data?.colleges ||
        response.data ||
        [];

      setColleges(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to load colleges:",
        error
      );

      setColleges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColleges();
  }, []);

  // ======================================================
  // OPEN CREATE MODAL
  // ======================================================

  const openCreateModal = () => {
    setEditingCollege(null);

    setForm({
      name: "",
      code: "",
      location: "",
    });

    setShowModal(true);
  };

  // ======================================================
  // OPEN EDIT MODAL
  // ======================================================

  const openEditModal = (college) => {
    setEditingCollege(college);

    setForm({
      name: college.name || "",
      code: college.code || "",
      location: college.location || "",
    });

    setShowModal(true);
  };

  // ======================================================
  // CLOSE MODAL
  // ======================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCollege(null);

    setForm({
      name: "",
      code: "",
      location: "",
    });
  };

  // ======================================================
  // SAVE COLLEGE
  // ======================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        location: form.location.trim(),
      };

      if (editingCollege) {
        await api.patch(
          `/colleges/${editingCollege._id}`,
          payload
        );
      } else {
        await api.post(
          "/colleges",
          payload
        );
      }

      closeModal();
      await loadColleges();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          `Failed to ${
            editingCollege
              ? "update"
              : "create"
          } college`
      );
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // TOGGLE COLLEGE STATUS
  // ======================================================

  const toggleStatus = async (college) => {
    const action = college.isActive
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${college.name}"?`
    );

    if (!confirmed) return;

    try {
      await api.patch(
        `/colleges/${college._id}/status`,
        {
          isActive: !college.isActive,
        }
      );

      await loadColleges();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          `Failed to ${action} college`
      );
    }
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="organization-page">
      {/* HEADER */}
      <div className="organization-header">
        <div>
          <p className="organization-eyebrow">
            ORGANIZATION
          </p>

          <h1>Colleges</h1>

          <p>
            Create and manage colleges available
            in the examination portal.
          </p>
        </div>

        <button
          className="organization-primary-button"
          onClick={openCreateModal}
        >
          + Create College
        </button>
      </div>

      {/* COLLEGE DIRECTORY */}
      <div className="organization-card">
        <div className="organization-card-header">
          <div>
            <h2>College Directory</h2>

            <span>
              {colleges.length} college
              {colleges.length !== 1
                ? "s"
                : ""}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="organization-empty">
            Loading colleges...
          </div>
        ) : colleges.length === 0 ? (
          <div className="organization-empty">
            <h3>No colleges found</h3>

            <p>
              Create your first college to start
              organizing students and batches.
            </p>
          </div>
        ) : (
          <div className="organization-table-wrapper">
            <table className="organization-table">
              <thead>
                <tr>
                  <th>College</th>
                  <th>Code</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {colleges.map((college) => (
                  <tr key={college._id}>
                    <td>
                      <strong>
                        {college.name}
                      </strong>
                    </td>

                    <td>{college.code}</td>

                    <td>
                      {college.location ||
                        "—"}
                    </td>

                    <td>
                      <span
                        className={`organization-status ${
                          college.isActive
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {college.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="organization-actions">
                        <button
                          type="button"
                          className="organization-edit-button"
                          onClick={() =>
                            openEditModal(
                              college
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className={
                            college.isActive
                              ? "organization-deactivate-button"
                              : "organization-activate-button"
                          }
                          onClick={() =>
                            toggleStatus(
                              college
                            )
                          }
                        >
                          {college.isActive
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================
          CREATE / EDIT MODAL
          ================================================== */}

      {showModal && (
        <div className="organization-modal-overlay">
          <div className="organization-modal">
            <div className="organization-modal-header">
              <div>
                <h2>
                  {editingCollege
                    ? "Edit College"
                    : "Create College"}
                </h2>

                <p>
                  {editingCollege
                    ? "Update the college information."
                    : "Add a college to the organization."}
                </p>
              </div>

              <button
                type="button"
                className="organization-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                College Name

                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="SRKR Engineering College"
                  required
                />
              </label>

              <label>
                College Code

                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      code: e.target.value,
                    })
                  }
                  placeholder="SRKR"
                  required
                />
              </label>

              <label>
                Location

                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      location:
                        e.target.value,
                    })
                  }
                  placeholder="Bhimavaram, Andhra Pradesh"
                />
              </label>

              <div className="organization-modal-actions">
                <button
                  type="button"
                  className="organization-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="organization-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCollege
                    ? "Save Changes"
                    : "Create College"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminColleges;