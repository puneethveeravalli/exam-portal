import { Link } from "react-router-dom";
import "./Unauthorized.css";

function Unauthorized() {
  return (
    <main className="unauthorized-page">
      <section className="unauthorized-card">
        <div className="unauthorized-code">403</div>

        <div className="unauthorized-divider" />

        <h1>Access Restricted</h1>

        <p>
          You do not have permission to access this page.
          Please return to your dashboard and continue from there.
        </p>

        <Link to="/login" className="unauthorized-button">
          Return to Login
        </Link>
      </section>
    </main>
  );
}

export default Unauthorized;