const express = require("express");
const prisma = require("../lib/prisma");
const auth = require("../middleware/auth");
const { ROLES } = require("../constants/domain");

const router = express.Router();

function isAdmin(user) {
  return user && user.role === ROLES.ADMIN;
}

function parseBoolean(value) {
  // Parses boolean flags from either JSON booleans or query/body strings.
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function getDefaultJobTitle(role) {
  return role === ROLES.ADMIN ? "Administrator" : "Operational Staff";
}

async function unassignIssuesForStaff(tx, staffId, changedByUserId, reason) {
  if (!staffId) return;

  // Gets issue ids first so history rows can be written after bulk unassign.
  const assignedIssues = await tx.issue.findMany({
    where: { staffId },
    select: { id: true },
  });

  if (!assignedIssues.length) return;

  await tx.issue.updateMany({
    where: { staffId },
    data: { staffId: null },
  });

  // Logs one UNASSIGNED history entry per affected issue.
  await tx.issueHistory.createMany({
    data: assignedIssues.map((issue) => ({
      issueId: issue.id,
      eventType: "UNASSIGNED",
      changedByUserId,
      comment: reason,
    })),
  });
}

router.use(auth);
router.use((req, res, next) => {
  // Applies one admin guard to every route below.
  if (!isAdmin(req.user)) {
    return res.status(403).json({ message: "Only admins can access this area" });
  }

  next();
});

router.get("/overview", async (req, res) => {
  try {
    // Loads dashboard counters in parallel to reduce admin page load time.
    const [users, staff, categories, issues, notes, history] = await Promise.all([
      prisma.user.count(),
      prisma.staff.count(),
      prisma.category.count(),
      prisma.issue.count(),
      prisma.note.count(),
      prisma.issueHistory.count(),
    ]);

    return res.status(200).json({
      counts: {
        users,
        staff,
        categories,
        issues,
        notes,
        history,
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return res.status(500).json({
      message: "Failed to load admin overview",
      details: error.message,
    });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        staffProfile: true,
        _count: {
          select: {
            issues: true,
            historyItems: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return res.status(500).json({
      message: "Failed to fetch users",
      details: error.message,
    });
  }
});

router.patch("/users/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: "A valid user ID is required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        staffProfile: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const trimmedName =
      typeof req.body.fullName === "string" ? req.body.fullName.trim() : undefined;
    const nextRole = req.body.role;
    const nextIsActive = parseBoolean(req.body.isActive);

    if (trimmedName !== undefined && !trimmedName) {
      return res.status(400).json({ message: "Full name cannot be empty" });
    }

    if (nextRole !== undefined && !Object.values(ROLES).includes(nextRole)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    const resolvedRole = nextRole || existingUser.role;
    const resolvedIsActive = nextIsActive ?? existingUser.isActive;

    // Stops admins from locking themselves out.
    if (existingUser.id === req.user.id) {
      if (resolvedRole !== ROLES.ADMIN) {
        return res.status(400).json({ message: "You cannot remove your own admin role" });
      }

      if (!resolvedIsActive) {
        return res.status(400).json({ message: "You cannot disable your own account" });
      }
    }

    const roleChangingToNonStaff =
      existingUser.staffProfile && existingUser.role !== ROLES.CITIZEN && resolvedRole === ROLES.CITIZEN;
    const becomingInactive = existingUser.staffProfile && existingUser.isActive && !resolvedIsActive;

    // Keeps user role/status update and related staff side effects in one transaction.
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          ...(trimmedName !== undefined ? { fullName: trimmedName } : {}),
          ...(nextRole !== undefined ? { role: resolvedRole } : {}),
          ...(nextIsActive !== undefined ? { isActive: resolvedIsActive } : {}),
        },
        include: {
          staffProfile: true,
        },
      });

      if ((resolvedRole === ROLES.STAFF || resolvedRole === ROLES.ADMIN) && !existingUser.staffProfile) {
        // Creates staff profile automatically when user becomes staff/admin.
        await tx.staff.create({
          data: {
            userId: user.id,
            jobTitle: getDefaultJobTitle(resolvedRole),
          },
        });
      }

      if (roleChangingToNonStaff) {
        // Unassigns staff cases when role changes back to citizen.
        await unassignIssuesForStaff(
          tx,
          existingUser.staffProfile.id,
          req.user.id,
          `${existingUser.fullName} was unassigned because their role changed to Citizen`
        );
      }

      if (becomingInactive) {
        // Unassigns active staff cases when account is disabled.
        await unassignIssuesForStaff(
          tx,
          existingUser.staffProfile.id,
          req.user.id,
          `${existingUser.fullName} was unassigned because their account was disabled`
        );
      }

      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          staffProfile: true,
          _count: {
            select: {
              issues: true,
              historyItems: true,
            },
          },
        },
      });
    });

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Admin user update error:", error);
    return res.status(500).json({
      message: "Failed to update user",
      details: error.message,
    });
  }
});

router.get("/staff", async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      include: {
        user: true,
        _count: {
          select: {
            assignedIssues: true,
            notes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ staff });
  } catch (error) {
    console.error("Admin staff fetch error:", error);
    return res.status(500).json({
      message: "Failed to fetch staff",
      details: error.message,
    });
  }
});

router.patch("/staff/:staffId", async (req, res) => {
  try {
    const staffId = Number(req.params.staffId);
    const jobTitle = typeof req.body.jobTitle === "string" ? req.body.jobTitle.trim() : "";

    if (!staffId) {
      return res.status(400).json({ message: "A valid staff ID is required" });
    }

    if (!jobTitle) {
      return res.status(400).json({ message: "Job title is required" });
    }

    const existingStaff = await prisma.staff.findUnique({ where: { id: staffId } });

    if (!existingStaff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const staff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        jobTitle,
      },
      include: {
        user: true,
        _count: {
          select: {
            assignedIssues: true,
            notes: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Staff profile updated successfully",
      staff,
    });
  } catch (error) {
    console.error("Admin staff update error:", error);
    return res.status(500).json({
      message: "Failed to update staff profile",
      details: error.message,
    });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ categories });
  } catch (error) {
    console.error("Admin categories fetch error:", error);
    return res.status(500).json({
      message: "Failed to fetch categories",
      details: error.message,
    });
  }
});

router.post("/categories", async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const description =
      typeof req.body.description === "string" && req.body.description.trim()
        ? req.body.description.trim()
        : null;
    const isActive = parseBoolean(req.body.isActive) ?? true;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existingCategory = await prisma.category.findFirst({
      where: { name },
    });

    if (existingCategory) {
      return res.status(409).json({ message: "A category with this name already exists" });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        isActive,
      },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Admin category create error:", error);
    return res.status(500).json({
      message: "Failed to create category",
      details: error.message,
    });
  }
});

router.patch("/categories/:categoryId", async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);

    if (!categoryId) {
      return res.status(400).json({ message: "A valid category ID is required" });
    }

    const existingCategory = await prisma.category.findUnique({ where: { id: categoryId } });

    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    const name = typeof req.body.name === "string" ? req.body.name.trim() : undefined;
    const description =
      typeof req.body.description === "string" ? req.body.description.trim() || null : undefined;
    const isActive = parseBoolean(req.body.isActive);

    if (name !== undefined && !name) {
      return res.status(400).json({ message: "Category name cannot be empty" });
    }

    if (name && name !== existingCategory.name) {
      // Checks for duplicates only when name is actually changing.
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name,
          NOT: { id: categoryId },
        },
      });

      if (duplicateCategory) {
        return res.status(409).json({ message: "A category with this name already exists" });
      }
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Admin category update error:", error);
    return res.status(500).json({
      message: "Failed to update category",
      details: error.message,
    });
  }
});

router.delete("/categories/:categoryId", async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);

    if (!categoryId) {
      return res.status(400).json({ message: "A valid category ID is required" });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (existingCategory._count.issues > 0) {
      // Blocks hard delete when issues still reference this category.
      return res.status(409).json({
        message: "This category is already linked to issues. Disable it instead of deleting it.",
      });
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Admin category delete error:", error);
    return res.status(500).json({
      message: "Failed to delete category",
      details: error.message,
    });
  }
});

router.get("/issues", async (req, res) => {
  try {
    // Returns denormalized issue data so admin tables can render without extra requests.
    const issues = await prisma.issue.findMany({
      include: {
        category: true,
        citizen: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        staff: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: {
            notes: true,
            history: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.status(200).json({ issues });
  } catch (error) {
    console.error("Admin issues fetch error:", error);
    return res.status(500).json({
      message: "Failed to fetch issues",
      details: error.message,
    });
  }
});

router.get("/notes", async (req, res) => {
  try {
    // Includes linked issue and staff user so admin notes table is self-contained.
    const notes = await prisma.note.findMany({
      include: {
        issue: {
          select: {
            id: true,
            caseId: true,
            title: true,
            status: true,
          },
        },
        staff: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ notes });
  } catch (error) {
    console.error("Admin notes fetch error:", error);
    return res.status(500).json({
      message: "Failed to fetch notes",
      details: error.message,
    });
  }
});

router.get("/history", async (req, res) => {
  try {
    // Includes actor and issue snapshot fields for full audit trail rows.
    const history = await prisma.issueHistory.findMany({
      include: {
        issue: {
          select: {
            id: true,
            caseId: true,
            title: true,
            status: true,
          },
        },
        changedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        changedAt: "desc",
      },
    });

    return res.status(200).json({ history });
  } catch (error) {
    console.error("Admin history fetch error:", error);
    return res.status(500).json({
      message: "Failed to fetch issue history",
      details: error.message,
    });
  }
});

module.exports = router;
