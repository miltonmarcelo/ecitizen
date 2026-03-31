const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const auth = require("../middleware/auth");
const admin = require("../config/firebaseAdmin");

router.post("/sync", auth, async (req, res) => {
  try {
    const { fullName } = req.body;

    const firebaseUid = req.firebaseUser?.uid;
    const email = req.firebaseUser?.email;
    const displayName = req.firebaseUser?.name || null;

    if (!firebaseUid || !email) {
      return res.status(400).json({
        message: "Firebase token is missing required user details",
      });
    }

    const finalName = fullName || displayName || email.split("@")[0];

    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ firebaseUid }, { email }],
      },
    });

    let user;

    if (existingUser) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firebaseUid,
          email,
          fullName: finalName,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          fullName: finalName,
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

router.post("/change-password", auth, async (req, res) => {
  try {
    const firebaseUid = req.firebaseUser?.uid;
    const { newPassword } = req.body;

    if (!firebaseUid) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!newPassword || typeof newPassword !== "string") {
      return res.status(400).json({
        message: "New password is required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    await admin.auth().updateUser(firebaseUid, {
      password: newPassword,
    });

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      message: "Failed to change password",
      details: error.message,
    });
  }
});

module.exports = router;