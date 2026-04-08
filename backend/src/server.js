const express = require("express");
const cors = require("cors");
require("dotenv").config();
const prisma = require("./lib/prisma");

const issueRoutes = require("./routes/issueRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use("/api/categories", categoryRoutes);

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

app.use("/api/users", userRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});