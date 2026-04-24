const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const auth = require("../middleware/auth");
const admin = require("../config/firebaseAdmin");
const { ROLES } = require("../constants/domain");

function isStaff(user) {
  return user && user.role === ROLES.STAFF;
}

function isAdmin(user) {
  return user && user.role === ROLES.ADMIN;
}

function isStaffOrAdmin(user) {
  return isStaff(user) || isAdmin(user);
}

router.post("/sync", auth, async (req, res) => {
  try {
    // Normalizes spacing so full names stay consistent in the database.
    const submittedFullName =
      typeof req.body?.fullName === "string"
        ? req.body.fullName.trim().replace(/\s+/g, " ")
        : "";

    const firebaseUid = req.firebaseUser?.uid;
    const email = req.firebaseUser?.email;
    const displayName = req.firebaseUser?.name || null;

    if (!firebaseUid || !email) {
      return res.status(400).json({
        message: "Firebase token is missing required user details",
      });
    }

    let existingUser = await prisma.user.findFirst({
      where: {
        // Matches either UID or email to handle first login after provider/account changes.
        OR: [{ firebaseUid }, { email }],
      },
      include: {
        staffProfile: true,
      },
    });

    let user;

    if (existingUser) {
      const updateData = {};

      if (existingUser.firebaseUid !== firebaseUid) {
        // Updates stale UID when the same email account links to a new Firebase UID.
        updateData.firebaseUid = firebaseUid;
      }

      if (existingUser.email !== email) {
        updateData.email = email;
      }

      user =
        // Skips update query when nothing actually changed.
        Object.keys(updateData).length > 0
          ? await prisma.user.update({
              where: { id: existingUser.id },
              data: updateData,
              include: {
                staffProfile: true,
              },
            })
          : existingUser;
    } else {
      // Creates new app user on first login with default citizen role.
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          fullName: submittedFullName || displayName || email.split("@")[0],
          role: ROLES.CITIZEN,
        },
        include: {
          staffProfile: true,
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

router.get("/me", auth, async (req, res) => {
  try {
    if (!req.user) {
      // Auth token was valid but no matching app user was found.
      return res.status(404).json({
        message: "User profile not found",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        staffProfile: true,
      },
    });

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      message: "Failed to load current user",
      details: error.message,
    });
  }
});

router.patch("/me", auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({
        message: "User profile not found",
      });
    }

    const fullName =
      typeof req.body?.fullName === "string"
        ? req.body.fullName.trim().replace(/\s+/g, " ")
        : "";

    if (!fullName) {
      return res.status(400).json({
        message: "Full name is required",
      });
    }

    if (fullName.length < 2) {
      return res.status(400).json({
        message: "Full name must be at least 2 characters",
      });
    }

    if (fullName.length > 100) {
      return res.status(400).json({
        message: "Full name is too long",
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { fullName },
      include: {
        staffProfile: true,
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update current user error:", error);
    return res.status(500).json({
      message: "Failed to update profile",
      details: error.message,
    });
  }
});

router.get("/staff-members", auth, async (req, res) => {
  try {
    if (!isStaffOrAdmin(req.user)) {
      return res.status(403).json({ message: "Only staff can view staff members" });
    }

    // Returns active staff/admin assignees sorted by name for assignment dropdowns.
    const staffMembers = await prisma.staff.findMany({
      where: {
        user: {
          isActive: true,
          role: {
            in: [ROLES.STAFF, ROLES.ADMIN],
          },
        },
      },
      orderBy: {
        user: {
          fullName: "asc",
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json({
      staffMembers,
    });
  } catch (error) {
    console.error("Get staff members error:", error);
    return res.status(500).json({
      message: "Failed to fetch staff members",
      details: error.message,
    });
  }
});

router.post("/change-password", auth, async (req, res) => {
  try {
    // Uses UID from verified token instead of trusting a client-sent user id.
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

    // Updates password directly in Firebase Auth.
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
