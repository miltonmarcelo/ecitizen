const express = require("express");
const cors = require("cors");
require("dotenv").config();
const prisma = require("./lib/prisma");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend for eCitizen is up and running" });
});

app.get("/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ database: "connected" });
  } catch (error) {
    res.status(500).json({ database: "error", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const issueRoutes = require("./routes/issueRoutes");
const userRoutes = require("./routes/userRoutes");
app.use("/api/issues", issueRoutes);
app.use("/api/users", userRoutes);