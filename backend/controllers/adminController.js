const bcrypt = require("bcryptjs");
const User = require("../models/User");

const createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      dateOfBirth,
      phoneNumber
    } = req.body;

    // 1. Validate required fields
    if (!name || !email || !dateOfBirth || !phoneNumber) {
      return res.status(400).json({
        message:
          "Name, email, date of birth and phone number are required"
      });
    }

    // 2. Check whether email already exists
    const existingEmail = await User.findOne({
      email: email.toLowerCase()
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

    // 6. Create student
    const student = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      dateOfBirth,
      phoneNumber: phoneNumber.trim(),
      username,
      password: hashedPassword,
      plainPassword: generatedPassword,
      role: "STUDENT"
    });

    // 7. Return generated credentials to admin
    res.status(201).json({
      message: "Student created successfully",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        dateOfBirth: student.dateOfBirth,
        phoneNumber: student.phoneNumber,
        username: student.username,
        password: generatedPassword,
        role: student.role,
        isActive: student.isActive
      }
    });
  } catch (error) {
    console.error("Create student error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};
const getStudents = async (req, res) => {
  try {
    const students = await User.find(
      { role: "STUDENT" }
    ).sort({ createdAt: -1 });

    res.json({
      students
    });
  } catch (error) {
    console.error("Get students error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};
const updateStudentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be true or false"
      });
    }

    const student = await User.findOneAndUpdate(
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
    console.error("Update student status error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  createStudent,
  getStudents,
  updateStudentStatus
};