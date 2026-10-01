import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminLayout.css";

function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navClass = ({ isActive }) =>
    `admin-nav-link ${isActive ? "active" : ""}`;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">EP</div>

          <div>
            <strong>Exam Portal</strong>
            <span>Administration</span>
          </div>
        </div>

        <nav className="admin-navigation">
          <p className="nav-section-title">MAIN</p>

          <NavLink to="/admin/dashboard" className={navClass}>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/admin/hiring-drives" className={navClass}>
            <span>Hiring Drives</span>
          </NavLink>

          <div className="nav-group">
            <p className="nav-section-title">ORGANIZATION</p>

            <NavLink to="/admin/colleges" className={navClass}>
              <span>Colleges</span>
            </NavLink>

            <NavLink to="/admin/batches" className={navClass}>
              <span>Batches</span>
            </NavLink>
          </div>

          <NavLink to="/admin/students" className={navClass}>
            <span>Students</span>
          </NavLink>

          <div className="nav-group">
            <p className="nav-section-title">EXAMINATION</p>

            <NavLink to="/admin/exams" className={navClass}>
              <span>All Exams</span>
            </NavLink>

            <NavLink to="/admin/exams/create" className={navClass}>
              <span>Create Exam</span>
            </NavLink>

            <NavLink to="/admin/question-bank" className={navClass}>
              <span>Question Bank</span>
            </NavLink>
          </div>

          <NavLink to="/admin/results" className={navClass}>
            <span>Results</span>
          </NavLink>

          <div className="nav-group">
            <p className="nav-section-title">ADMINISTRATION</p>

            <NavLink to="/admin/create-admin" className={navClass}>
              <span>Admin Accounts</span>
            </NavLink>
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div className="admin-user-details">
              <strong>{user?.name || "Administrator"}</strong>
              <span>{user?.role || "ADMIN"}</span>
            </div>
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;