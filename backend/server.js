const express = require("express");

const app = express();

const PORT = 5000;

app.get("/api/health", (req, res) => {
  res.json({
    message: "Your API is working fine",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});