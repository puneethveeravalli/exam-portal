import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  // User is not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // User is logged in but does not have the required role
  if (
    allowedRoles &&
    (!user || !allowedRoles.includes(user.role))
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Access granted
  return children;
}

export default ProtectedRoute;