import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Unauthorized from "./pages/Unauthorized";

import AdminStudents from "./pages/AdminStudents";
import AdminExams from "./pages/AdminExams";
import AdminQuestions from "./pages/AdminQuestions";
import AdminResults from "./pages/AdminResults";
import CreateAdmin from "./pages/CreateAdmin";
import QuestionBank from "./pages/QuestionBank";
import AdminExamBuilder from "./pages/AdminExamBuilder";
import AdminHiringDrives from "./pages/AdminHiringDrives";
import AdminColleges from "./pages/AdminColleges";
import AdminBatches from "./pages/AdminBatches";

import TakeExam from "./pages/TakeExam";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>

          {/* =========================
              AUTHENTICATION
          ========================= */}

          <Route path="/login" element={<Login />} />


          {/* =========================
              ADMIN
          ========================= */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route
              path="dashboard"
              element={<AdminDashboard />}
            />

            {/* Hiring */}
            <Route
              path="hiring-drives"
              element={<AdminHiringDrives />}
            />

            {/* Students */}
            <Route
              path="students"
              element={<AdminStudents />}
            />
            <Route
  path="colleges"
  element={<AdminColleges />}
/>

<Route
  path="batches"
  element={<AdminBatches />}
/>

            {/* Exams */}
            <Route
              path="exams"
              element={<AdminExams />}
            />

            <Route
              path="exams/create"
              element={<AdminExamBuilder />}
            />

            <Route
              path="exams/:examId/questions"
              element={<AdminQuestions />}
            />

            <Route
              path="question-bank"
              element={<QuestionBank />}
            />

            {/* Results */}
            <Route
              path="results"
              element={<AdminResults />}
            />

            {/* Administration */}
            <Route
              path="create-admin"
              element={<CreateAdmin />}
            />
          </Route>


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