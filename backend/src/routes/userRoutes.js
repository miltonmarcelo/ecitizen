const express = require("express");
const router = express.Router();

router.post("/sync", (req, res) => {
  res.json({ message: "Sync Firebase user to local DB" });
});

module.exports = router;