const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Get issues" });
});

router.post("/", (req, res) => {
  res.json({ message: "Create issue" });
});

router.get("/:id", (req, res) => {
  res.json({ message: `Get issue ${req.params.id}` });
});

router.patch("/:id/status", (req, res) => {
  res.json({ message: `Update status for issue ${req.params.id}` });
});

router.post("/:id/notes", (req, res) => {
  res.json({ message: `Add note to issue ${req.params.id}` });
});

module.exports = router;