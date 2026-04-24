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

// Limits browser access to known frontend origins.
const allowedOrigins = [
  "http://localhost:8080",
  "https://ecitizen.onrender.com",
];

const corsOptions = {
  origin(origin, callback) {
    // Allows non-browser requests that do not send an Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend for eCitizen is up and running" });
});

app.get("/health/db", async (req, res) => {
  try {
    // Runs a lightweight query to confirm Prisma can reach the database.
    await prisma.$queryRaw`SELECT 1`;
    res.json({ database: "connected" });
  } catch (error) {
    res.status(500).json({ database: "error", details: error.message });
  }
});

app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
