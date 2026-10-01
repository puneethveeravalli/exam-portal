import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./CreateAdmin.css";

const CreateAdmin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    phoneNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [createdCredentials, setCreatedCredentials] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);
    setCreatedCredentials(null);

    try {
      const response = await api.post("/admin/admins", formData);

      setCreatedCredentials(response.data.admin);

      setSuccess("Administrator account created successfully.");

      setFormData({
        name: "",
        email: "",
        dateOfBirth: "",
        phoneNumber: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create administrator account."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = async () => {
    if (!createdCredentials) return;

    const credentials = `Name: ${createdCredentials.name}
Username: ${createdCredentials.username}
Password: ${createdCredentials.password}`;

    try {
      await navigator.clipboard.writeText(credentials);
      setSuccess("Credentials copied to clipboard.");
    } catch (err) {
      setError("Unable to copy credentials.");
    }
  };

  return (
    <div className="create-admin-page">
      {/* PAGE HEADER */}
      <div className="create-admin-page-header">
        <div>
          <span className="create-admin-eyebrow">
            ADMINISTRATION
          </span>

          <h1>Create Administrator</h1>

          <p>
            Create and manage administrator access for the examination
            platform.
          </p>
        </div>

        <button
          type="button"
          className="create-admin-secondary-btn"
          onClick={() => navigate("/admin/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {/* NOTIFICATIONS */}
      {error && (
        <div className="create-admin-alert create-admin-alert-error">
          <div className="create-admin-alert-icon">!</div>

          <div>
            <strong>Unable to create administrator</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="create-admin-alert create-admin-alert-success">
          <div className="create-admin-alert-icon">✓</div>

          <div>
            <strong>Success</strong>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="create-admin-workspace">
        {/* CREATE ADMIN CARD */}
        <section className="create-admin-card">
          <div className="create-admin-card-header">
            <div>
              <span className="create-admin-section-label">
                ADMIN ACCOUNT
              </span>

              <h2>Create Administrator</h2>

              <p>
                Enter the administrator's basic details. Username and
                password will be generated automatically.
              </p>
            </div>
          </div>

          <form
            className="create-admin-form"
            onSubmit={handleSubmit}
          >
            {/* PERSONAL DETAILS */}
            <div className="create-admin-form-section">
              <div className="create-admin-form-section-heading">
                <span>PERSONAL DETAILS</span>
                <p>Basic information for the administrator account.</p>
              </div>

              <div className="create-admin-form-grid">
                <div className="create-admin-field">
                  <label htmlFor="name">
                    Full Name <span>*</span>
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="create-admin-field">
                  <label htmlFor="email">
                    Email Address <span>*</span>
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="create-admin-field">
                  <label htmlFor="dateOfBirth">
                    Date of Birth <span>*</span>
                  </label>

                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="create-admin-field">
                  <label htmlFor="phoneNumber">
                    Phone Number <span>*</span>
                  </label>

                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="create-admin-divider" />

            {/* ACCOUNT INFORMATION */}
            <div className="create-admin-form-section">
              <div className="create-admin-form-section-heading">
                <span>ACCOUNT INFORMATION</span>
                <p>
                  Login credentials are generated automatically after
                  account creation.
                </p>
              </div>

              <div className="create-admin-info-grid">
                <div className="create-admin-info-box">
                  <span>ROLE</span>
                  <strong>ADMIN</strong>
                  <p>Full administrator access</p>
                </div>

                <div className="create-admin-info-box">
                  <span>USERNAME</span>
                  <strong>AUTO GENERATED</strong>
                  <p>Created automatically</p>
                </div>

                <div className="create-admin-info-box">
                  <span>PASSWORD</span>
                  <strong>AUTO GENERATED</strong>
                  <p>Created automatically</p>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="create-admin-form-actions">
              <button
                type="button"
                className="create-admin-cancel-btn"
                onClick={() => navigate("/admin/dashboard")}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="create-admin-primary-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="create-admin-spinner" />
                    Creating...
                  </>
                ) : (
                  "Create Administrator"
                )}
              </button>
            </div>
          </form>
        </section>

        {/* CREDENTIALS CARD */}
        <aside className="create-admin-credentials-card">
          <div className="create-admin-card-header">
            <div>
              <span className="create-admin-section-label">
                ACCESS DETAILS
              </span>

              <h2>Generated Credentials</h2>

              <p>
                Credentials for the newly created administrator account.
              </p>
            </div>
          </div>

          {createdCredentials ? (
            <div className="create-admin-credentials-content">
              <div className="create-admin-credential-status">
                <div className="create-admin-status-icon">✓</div>

                <div>
                  <strong>Account Created</strong>
                  <p>
                    Share these credentials securely with the
                    administrator.
                  </p>
                </div>
              </div>

              <div className="create-admin-credential-list">
                <div className="create-admin-credential-item">
                  <span>Name</span>
                  <strong>{createdCredentials.name}</strong>
                </div>

                <div className="create-admin-credential-item">
                  <span>Username</span>
                  <strong>{createdCredentials.username}</strong>
                </div>

                <div className="create-admin-credential-item">
                  <span>Password</span>
                  <strong>{createdCredentials.password}</strong>
                </div>
              </div>

              <button
                type="button"
                className="create-admin-copy-btn"
                onClick={copyCredentials}
              >
                Copy Credentials
              </button>
            </div>
          ) : (
            <div className="create-admin-empty-credentials">
              <div className="create-admin-empty-icon">+</div>

              <strong>No credentials generated yet</strong>

              <p>
                Create an administrator account to generate login
                credentials.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default CreateAdmin;