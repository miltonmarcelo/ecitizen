const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const auth = require("../middleware/auth");

router.post("/sync", auth, async (req, res) => {
  try {
    const { fullName } = req.body;

    const firebaseUid = req.firebaseUser.uid;
    const email = req.firebaseUser.email;
    const displayName = req.firebaseUser.name || null;

    if (!firebaseUid || !email) {
      return res.status(400).json({
        message: "Firebase token is missing required user details",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    let user;

    if (existingUser) {
      user = await prisma.user.update({
        where: { firebaseUid },
        data: {
          email,
          fullName: fullName || displayName || existingUser.fullName,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          fullName: fullName || displayName,
          role: "CITIZEN",
        },
      });
    }

    return res.status(200).json({
      message: "User synced successfully",
      user,
    });
  } catch (error) {
    console.error("User sync error:", error);
    return res.status(500).json({
      message: "Failed to sync user",
      details: error.message,
    });
  }
});

module.exports = router;