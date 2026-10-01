const bcrypt = require("bcryptjs");
const User = require("../models/User");
const XLSX = require("xlsx");
const College = require("../models/College");
const Batch = require("../models/Batch");

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

// Generate a unique username from the student's name
const generateUniqueUsername = async (name) => {
  const namePart =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20) || "student";

  let username;
  let usernameExists = true;

  while (usernameExists) {
    const randomNumber = Math.floor(
      1000 + Math.random() * 9000
    );

    username = `${namePart}${randomNumber}`;

    usernameExists = await User.findOne({
      username
    });
  }

  return username;
};


// Generate a temporary password
const generatePassword = (name) => {
  const firstName =
    name
      .trim()
      .split(" ")[0]
      .replace(/[^a-zA-Z0-9]/g, "") || "Student";

  const randomPart = Math.random()
    .toString(36)
    .substring(2, 6);

  return `${firstName}@${randomPart}`;
};


/* =========================================================
   CREATE STUDENT
========================================================= */

const createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      dateOfBirth,
      phoneNumber,
      collegeId,
      batchId,
      branch,
    } = req.body;

    // 1. Validate required fields
    if (
      !name ||
      !email ||
      !dateOfBirth ||
      !phoneNumber ||
      !collegeId ||
      !batchId ||
      !branch
    ) {
      return res.status(400).json({
        message:
          "Name, email, date of birth, phone number, college, batch and branch are required.",
      });
    }

    // 2. Check duplicate email
    const existingStudent = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingStudent) {
      return res.status(400).json({
        message: "A user with this email already exists.",
      });
    }

    // 3. Check college
    const college = await College.findOne({
      _id: collegeId,
      isActive: true,
    });

    if (!college) {
      return res.status(400).json({
        message:
          "Selected college does not exist or is inactive.",
      });
    }

    // 4. Check batch
    const batch = await Batch.findOne({
      _id: batchId,
      isActive: true,
    });

    if (!batch) {
      return res.status(400).json({
        message:
          "Selected batch does not exist or is inactive.",
      });
    }

    // 5. Make sure batch belongs to selected college
    if (
      batch.college.toString() !==
      collegeId.toString()
    ) {
      return res.status(400).json({
        message:
          "Selected batch does not belong to the selected college.",
      });
    }

    // 6. Validate branch against batch
    const selectedBranch = batch.branches?.find(
      (item) =>
        item.code?.toLowerCase() ===
          branch.trim().toLowerCase() ||
        item.name?.toLowerCase() ===
          branch.trim().toLowerCase()
    );

    if (!selectedBranch) {
      return res.status(400).json({
        message:
          "Selected branch is not available in this batch.",
      });
    }

    // 7. Generate credentials
    const username = await generateUniqueUsername(
      name
    );

    const generatedPassword =
      generatePassword(name);

    const hashedPassword =
      await bcrypt.hash(
        generatedPassword,
        10
      );

    // 8. Create student
    const student = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      dateOfBirth,
      phoneNumber: phoneNumber.trim(),

      username,

      password: hashedPassword,

      // Existing requirement:
      // admin can view/share generated password
      plainPassword: generatedPassword,

      role: "STUDENT",

      college: collegeId,
      batch: batchId,

      // Store branch code
      branch: selectedBranch.code,

      isActive: true,
    });

    return res.status(201).json({
      message:
        "Student account created successfully.",

      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        dateOfBirth: student.dateOfBirth,
        phoneNumber: student.phoneNumber,

        username: student.username,

        password: generatedPassword,
        plainPassword: generatedPassword,

        college: {
          _id: college._id,
          name: college.name,
          code: college.code,
        },

        batch: {
          _id: batch._id,
          name: batch.name,
          year: batch.year,
        },

        branch: selectedBranch.code,

        isActive: student.isActive,
      },
    });
  } catch (error) {
    console.error(
      "Create student error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create student.",
    });
  }
};


/* =========================================================
   BULK CREATE STUDENTS
========================================================= */

const bulkCreateStudents = async (req, res) => {
  try {
    const { collegeId, batchId } = req.body;

    if (!collegeId || !batchId) {
      return res.status(400).json({
        message: "College and batch are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Excel file is required"
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer"
    });

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return res.status(400).json({
        message: "Excel sheet is empty"
      });
    }

    const worksheet = workbook.Sheets[sheetName];

    const students = XLSX.utils.sheet_to_json(worksheet, {
      defval: ""
    });

    if (!students.length) {
      return res.status(400).json({
        message: "No student records found in Excel file"
      });
    }

    const createdStudents = [];
    const skippedStudents = [];

    for (let i = 0; i < students.length; i++) {
      const row = students[i];

      const name = String(row.Name || "").trim();
      const email = String(row.Email || "").trim().toLowerCase();
      const dateOfBirth = row.DOB;
      const phoneNumber = String(row.Phone || "").trim();
      const branch = String(row.Branch || "").trim();

      const rowNumber = i + 2;

      if (
        !name ||
        !email ||
        !dateOfBirth ||
        !phoneNumber ||
        !branch
      ) {
        skippedStudents.push({
          row: rowNumber,
          email,
          reason: "Missing required field"
        });

        continue;
      }

      const existingUser = await User.findOne({
        email
      });

      if (existingUser) {
        skippedStudents.push({
          row: rowNumber,
          email,
          reason: "Email already exists"
        });

        continue;
      }

      const namePart =
        name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]/g, "") || "student";

      let username;
      let usernameExists = true;

      while (usernameExists) {
        const randomNumber = Math.floor(
          1000 + Math.random() * 9000
        );

        username = `${namePart}${randomNumber}`;

        usernameExists = await User.findOne({
          username
        });
      }

      const firstName = name.split(" ")[0];

      const randomPart = Math.random()
        .toString(36)
        .substring(2, 6);

      const generatedPassword =
        `${firstName}@${randomPart}`;

      const hashedPassword = await bcrypt.hash(
        generatedPassword,
        10
      );

      const student = await User.create({
        name,
        email,
        dateOfBirth,
        phoneNumber,
        username,
        password: hashedPassword,
        plainPassword: generatedPassword,
        role: "STUDENT",
        college: collegeId,
        batch: batchId,
        branch,
        isActive: true
      });

      createdStudents.push({
        id: student._id,
        name: student.name,
        email: student.email,
        username: student.username,
        password: generatedPassword,
        branch: student.branch
      });
    }

    return res.status(201).json({
      message: "Bulk student upload completed",

      summary: {
        totalRows: students.length,
        created: createdStudents.length,
        skipped: skippedStudents.length
      },

      createdStudents,
      skippedStudents
    });
  } catch (error) {
    console.error(
      "Bulk student upload error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error during bulk student upload"
    });
  }
};


/* =========================================================
   CREATE ADMIN
========================================================= */

const createAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      dateOfBirth,
      phoneNumber
    } = req.body;

    // 1. Validate required fields
    if (
      !name ||
      !email ||
      !dateOfBirth ||
      !phoneNumber
    ) {
      return res.status(400).json({
        message:
          "Name, email, date of birth and phone number are required"
      });
    }

    // 2. Check whether email already exists
    const existingEmail = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingEmail) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    // 3. Generate username from name
    const namePart = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "");

    let username;
    let usernameExists = true;

    while (usernameExists) {
      const randomNumber = Math.floor(
        1000 + Math.random() * 9000
      );

      username = `${namePart}${randomNumber}`;

      usernameExists = await User.findOne({
        username
      });
    }

    // 4. Generate temporary password
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 6);

    const generatedPassword = `${name
      .trim()
      .split(" ")[0]}@${randomPart}`;

    // 5. Hash password before storing
    const hashedPassword = await bcrypt.hash(
      generatedPassword,
      10
    );

    // 6. Create admin
    const admin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      dateOfBirth,
      phoneNumber: phoneNumber.trim(),
      username,
      password: hashedPassword,
      plainPassword: generatedPassword,
      role: "ADMIN"
    });

    // 7. Return generated credentials
    res.status(201).json({
      message: "Admin created successfully",

      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        dateOfBirth: admin.dateOfBirth,
        phoneNumber: admin.phoneNumber,
        username: admin.username,
        password: generatedPassword,
        role: admin.role,
        isActive: admin.isActive
      }
    });

  } catch (error) {
    console.error(
      "Create admin error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};


/* =========================================================
   GET STUDENTS
========================================================= */

const getStudents = async (req, res) => {
  try {
    const students = await User.find({
      role: "STUDENT"
    })
      .populate("college", "name code")
      .populate("batch", "name year")
      .sort({ createdAt: -1 });

    res.json({
      students
    });
  } catch (error) {
    console.error(
      "Get students error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};


/* =========================================================
   UPDATE STUDENT STATUS
========================================================= */

const updateStudentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message:
          "isActive must be true or false"
      });
    }

    const student =
      await User.findOneAndUpdate(
        {
          _id: studentId,
          role: "STUDENT"
        },
        {
          isActive
        },
        {
          new: true
        }
      );

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    res.json({
      message: isActive
        ? "Student activated successfully"
        : "Student deactivated successfully",

      student: {
        id: student._id,
        name: student.name,
        username: student.username,
        isActive: student.isActive
      }
    });
  } catch (error) {
    console.error(
      "Update student status error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  createStudent,
  getStudents,
  updateStudentStatus,
  createAdmin,
  bulkCreateStudents
};