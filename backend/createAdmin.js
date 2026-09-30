const bcrypt = require("bcryptjs");
const connectDatabase = require("./config/database");
const User = require("./models/User");

const createAdmin = async () => {
  try {
    await connectDatabase();

    const existingAdmin = await User.findOne({
      username: "admin"
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    await User.create({
      name: "System Admin",
      username: "admin",
      password: hashedPassword,
      role: "ADMIN"
    });

    console.log("Admin created successfully");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();