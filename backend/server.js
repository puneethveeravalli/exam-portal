require("dotenv").config();
const{authenticate,authorize}=require("./middleware/authMiddleware");

const express = require("express");
const cors = require("cors");


const connectDatabase = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const adminRoute = require("./routes/adminRoute");
const examRoutes = require("./routes/examRoutes");
const questionRoutes = require("./routes/questionRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const batchRoutes = require("./routes/batchRoutes");
const examSectionRoutes = require("./routes/examSectionRoutes");
const examQuestionRoutes = require("./routes/examQuestionRoutes");
const hiringDriveRoutes = require("./routes/hiringDriveRoutes");
const hiringDriveBatchRoutes = require("./routes/hiringDriveBatchRoutes");
const hiringDriveExamRoutes = require("./routes/hiringDriveExamRoutes");
const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoute);
app.use("/api/exams", examRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/exam-sections", examSectionRoutes);
app.use("/api/exam-questions", examQuestionRoutes);
app.use("/api/hiring-drives", hiringDriveRoutes);
app.use("/api/hiring-drive-batches", hiringDriveBatchRoutes);
app.use("/api/hiring-drive-exams", hiringDriveExamRoutes);
app.get("/api/health", (req, res) => {
  res.json({
    message: "Exam Portal API is running"
  });
});

app.get(
  "/api/admin/test",
  authenticate,
  authorize("ADMIN"),
  (req, res) => {
    res.json({
      message: "Welcome Admin",
      user: req.user
    });
  }
);
app.use(
  "/api/exam-questions",
  examQuestionRoutes
);
app.get(
  "/api/student/test",
  authenticate,
  authorize("STUDENT"),
  (req, res) => {
    res.json({
      message: "Welcome Student",
      user: req.user
    });
  }
);

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();