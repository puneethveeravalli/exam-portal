import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Unauthorized from "./pages/Unauthorized";
import AdminStudents from "./pages/AdminStudents";
import AdminExams from "./pages/AdminExams";
import AdminQuestions from "./pages/AdminQuestions";
import TakeExam from "./pages/TakeExam";
import AdminResults from "./pages/AdminResults";

import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          {/* =========================
              AUTHENTICATION
          ========================= */}

          <Route
            path="/login"
            element={<Login />}
          />

          {/* =========================
              ADMIN
          ========================= */}

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminStudents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/exams"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminExams />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/exams/:examId/questions"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminQuestions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/results"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminResults />
              </ProtectedRoute>
            }
          />

          {/* =========================
              STUDENT
          ========================= */}

          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/exam"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <TakeExam />
              </ProtectedRoute>
            }
          />

          {/* =========================
              UNAUTHORIZED
          ========================= */}

          <Route
            path="/unauthorized"
            element={<Unauthorized />}
          />

          {/* =========================
              FALLBACK
          ========================= */}

          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;