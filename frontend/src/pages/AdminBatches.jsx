import { useEffect, useState } from "react";
import api from "../services/api";
import "./AdminOrganizations.css";

function AdminBatches() {
  const [batches, setBatches] = useState([]);
  const [colleges, setColleges] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] =
    useState(false);

  const [editingBatch, setEditingBatch] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] = useState({
    name: "",
    year: "",
    college: "",
  });

  const [branches, setBranches] =
    useState([]);

  const [branchForm, setBranchForm] =
    useState({
      name: "",
      code: "",
    });

  // ======================================================
  // LOAD DATA
  // ======================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        batchResponse,
        collegeResponse,
      ] = await Promise.all([
        api.get("/batches"),
        api.get("/colleges"),
      ]);

      const batchData =
        batchResponse.data?.batches ||
        batchResponse.data ||
        [];

      const collegeData =
        collegeResponse.data?.colleges ||
        collegeResponse.data ||
        [];

      setBatches(
        Array.isArray(batchData)
          ? batchData
          : []
      );

      setColleges(
        Array.isArray(collegeData)
          ? collegeData
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load organization data:",
        error
      );

      setBatches([]);
      setColleges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ======================================================
  // RESET FORM
  // ======================================================

  const resetForm = () => {
    setForm({
      name: "",
      year: "",
      college: "",
    });

    setBranches([]);

    setBranchForm({
      name: "",
      code: "",
    });

    setEditingBatch(null);
  };

  // ======================================================
  // OPEN CREATE
  // ======================================================

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  // ======================================================
  // OPEN EDIT
  // ======================================================

  const openEditModal = (batch) => {
    setEditingBatch(batch);

    setForm({
      name: batch.name || "",
      year: batch.year || "",
      college:
        typeof batch.college ===
        "object"
          ? batch.college?._id || ""
          : batch.college || "",
    });

    setBranches(
      Array.isArray(batch.branches)
        ? batch.branches.map(
            (branch) => ({
              name: branch.name || "",
              code: branch.code || "",
            })
          )
        : []
    );

    setBranchForm({
      name: "",
      code: "",
    });

    setShowModal(true);
  };

  // ======================================================
  // CLOSE MODAL
  // ======================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  // ======================================================
  // ADD BRANCH
  // ======================================================

  const handleAddBranch = () => {
    const name =
      branchForm.name.trim();

    const code =
      branchForm.code
        .trim()
        .toUpperCase();

    if (!name || !code) {
      alert(
        "Enter branch name and branch code"
      );
      return;
    }

    const duplicate =
      branches.some(
        (branch) =>
          branch.code
            .trim()
            .toUpperCase() === code
      );

    if (duplicate) {
      alert(
        "This branch code is already added"
      );
      return;
    }

    setBranches((previous) => [
      ...previous,
      {
        name,
        code,
      },
    ]);

    setBranchForm({
      name: "",
      code: "",
    });
  };

  // ======================================================
  // EDIT BRANCH
  // ======================================================

  const handleEditBranch = (index) => {
    const branch = branches[index];

    const newName = window.prompt(
      "Enter branch name:",
      branch.name
    );

    if (newName === null) return;

    const newCode = window.prompt(
      "Enter branch code:",
      branch.code
    );

    if (newCode === null) return;

    const cleanName =
      newName.trim();

    const cleanCode =
      newCode.trim().toUpperCase();

    if (!cleanName || !cleanCode) {
      alert(
        "Branch name and code are required"
      );
      return;
    }

    const duplicate =
      branches.some(
        (item, branchIndex) =>
          branchIndex !== index &&
          item.code
            .trim()
            .toUpperCase() ===
            cleanCode
      );

    if (duplicate) {
      alert(
        "This branch code is already used"
      );
      return;
    }

    setBranches((previous) =>
      previous.map(
        (item, branchIndex) =>
          branchIndex === index
            ? {
                name: cleanName,
                code: cleanCode,
              }
            : item
      )
    );
  };

  // ======================================================
  // REMOVE BRANCH
  // ======================================================

  const handleRemoveBranch = (
    index
  ) => {
    const branch =
      branches[index];

    const confirmed =
      window.confirm(
        `Remove ${branch.name} (${branch.code}) from this batch?`
      );

    if (!confirmed) return;

    setBranches((previous) =>
      previous.filter(
        (_, branchIndex) =>
          branchIndex !== index
      )
    );
  };

  // ======================================================
  // SAVE BATCH
  // ======================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!form.college) {
      alert("Select a college");
      return;
    }

    if (branches.length === 0) {
      alert(
        "Add at least one branch to the batch"
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        year: Number(form.year),
        college: form.college,
        branches,
      };

      if (editingBatch) {
        await api.patch(
          `/batches/${editingBatch._id}`,
          payload
        );
      } else {
        await api.post(
          "/batches",
          payload
        );
      }

      closeModal();

      await loadData();
    } catch (error) {
      console.error(
        "Save batch error:",
        error
      );

      alert(
        error.response?.data?.message ||
          `Failed to ${
            editingBatch
              ? "update"
              : "create"
          } batch`
      );
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // TOGGLE STATUS
  // ======================================================

  const toggleStatus = async (
    batch
  ) => {
    const action = batch.isActive
      ? "deactivate"
      : "activate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} "${batch.name}"?`
      );

    if (!confirmed) return;

    try {
      await api.patch(
        `/batches/${batch._id}/status`,
        {
          isActive:
            !batch.isActive,
        }
      );

      await loadData();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          `Failed to ${action} batch`
      );
    }
  };

  // ======================================================
  // GET COLLEGE NAME
  // ======================================================

  const getCollegeName = (
    college
  ) => {
    if (
      typeof college ===
      "object"
    ) {
      return (
        college?.name || "—"
      );
    }

    return (
      colleges.find(
        (item) =>
          item._id === college
      )?.name || "—"
    );
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

          <h1>Batches</h1>

          <p>
            Manage student batches and
            their available branches.
          </p>
        </div>

        <button
          className="organization-primary-button"
          onClick={
            openCreateModal
          }
        >
          + Create Batch
        </button>
      </div>

      {/* DIRECTORY */}

      <div className="organization-card">
        <div className="organization-card-header">
          <div>
            <h2>
              Batch Directory
            </h2>

            <span>
              {batches.length} batch
              {batches.length !==
              1
                ? "es"
                : ""}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="organization-empty">
            Loading batches...
          </div>
        ) : batches.length ===
          0 ? (
          <div className="organization-empty">
            <h3>
              No batches found
            </h3>

            <p>
              Create a batch after
              adding a college.
            </p>
          </div>
        ) : (
          <div className="organization-table-wrapper">
            <table className="organization-table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Year</th>
                  <th>College</th>
                  <th>Branches</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {batches.map(
                  (batch) => (
                    <tr
                      key={
                        batch._id
                      }
                    >
                      <td>
                        <strong>
                          {batch.name}
                        </strong>
                      </td>

                      <td>
                        {batch.year}
                      </td>

                      <td>
                        {getCollegeName(
                          batch.college
                        )}
                      </td>

                      <td>
                        <div className="branch-list">
                          {Array.isArray(
                            batch.branches
                          ) &&
                          batch
                            .branches
                            .length >
                            0 ? (
                            batch.branches.map(
                              (
                                branch
                              ) => (
                                <span
                                  className="branch-chip"
                                  key={
                                    branch.code
                                  }
                                >
                                  {
                                    branch.code
                                  }
                                </span>
                              )
                            )
                          ) : (
                            <span>
                              —
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`organization-status ${
                            batch.isActive
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {batch.isActive
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
                                batch
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={
                              batch.isActive
                                ? "organization-deactivate-button"
                                : "organization-activate-button"
                            }
                            onClick={() =>
                              toggleStatus(
                                batch
                              )
                            }
                          >
                            {batch.isActive
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
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
          <div className="organization-modal batch-modal">
            <div className="organization-modal-header">
              <div>
                <h2>
                  {editingBatch
                    ? "Edit Batch"
                    : "Create Batch"}
                </h2>

                <p>
                  {editingBatch
                    ? "Update batch details and manage its branches."
                    : "Create a batch and define its available branches."}
                </p>
              </div>

              <button
                type="button"
                className="organization-close"
                onClick={
                  closeModal
                }
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              {/* COLLEGE */}

              <label>
                College

                <select
                  value={
                    form.college
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      college:
                        e.target
                          .value,
                    })
                  }
                  required
                >
                  <option value="">
                    Select College
                  </option>

                  {colleges
                    .filter(
                      (
                        college
                      ) =>
                        college.isActive !==
                        false
                    )
                    .map(
                      (
                        college
                      ) => (
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
                          }{" "}
                          (
                          {
                            college.code
                          }
                          )
                        </option>
                      )
                    )}
                </select>
              </label>

              {/* BATCH NAME */}

              <label>
                Batch Name

                <input
                  value={
                    form.name
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target
                        .value,
                    })
                  }
                  placeholder="B.Tech"
                  required
                />
              </label>

              {/* YEAR */}

              <label>
                Academic Year

                <input
                  type="number"
                  value={
                    form.year
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      year: e.target
                        .value,
                    })
                  }
                  placeholder="2026"
                  min="2000"
                  max="2100"
                  required
                />
              </label>

              {/* BRANCH MANAGEMENT */}

              <div className="branch-builder">
                <div className="branch-builder-header">
                  <div>
                    <strong>
                      Branches
                    </strong>

                    <span>
                      Add and manage branches
                      available for this
                      batch.
                    </span>
                  </div>
                </div>

                {/* ADD BRANCH */}

                <div className="branch-add-row">
                  <input
                    value={
                      branchForm.name
                    }
                    onChange={(e) =>
                      setBranchForm({
                        ...branchForm,
                        name: e.target
                          .value,
                      })
                    }
                    placeholder="Branch name"
                  />

                  <input
                    value={
                      branchForm.code
                    }
                    onChange={(e) =>
                      setBranchForm({
                        ...branchForm,
                        code: e.target
                          .value,
                      })
                    }
                    placeholder="Code"
                  />

                  <button
                    type="button"
                    className="branch-add-button"
                    onClick={
                      handleAddBranch
                    }
                  >
                    Add
                  </button>
                </div>

                {/* EXISTING BRANCHES */}

                {branches.length >
                  0 && (
                  <div className="selected-branches">
                    {branches.map(
                      (
                        branch,
                        index
                      ) => (
                        <div
                          className="selected-branch"
                          key={`${branch.code}-${index}`}
                        >
                          <div>
                            <strong>
                              {
                                branch.name
                              }
                            </strong>

                            <span>
                              {
                                branch.code
                              }
                            </span>
                          </div>

                          <div className="branch-actions">
                            <button
                              type="button"
                              className="branch-edit-button"
                              onClick={() =>
                                handleEditBranch(
                                  index
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="branch-remove-button"
                              onClick={() =>
                                handleRemoveBranch(
                                  index
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* ACTIONS */}

              <div className="organization-modal-actions">
                <button
                  type="button"
                  className="organization-cancel-button"
                  onClick={
                    closeModal
                  }
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
                    : editingBatch
                    ? "Save Changes"
                    : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBatches;