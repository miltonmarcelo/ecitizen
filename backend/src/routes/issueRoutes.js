const express = require("express");
const prisma = require("../lib/prisma");
const auth = require("../middleware/auth");
const generateCaseId = require("../utils/generateCaseId");
const admin = require("../config/firebaseAdmin");
const {
  ROLES,
  ISSUE_STATUS,
  ISSUE_EVENT_TYPE,
  ALL_ISSUE_STATUSES,
} = require("../constants/domain");

const router = express.Router();

async function generateUniqueCaseId() {
  let caseId;
  let exists = true;

  while (exists) {
    caseId = generateCaseId();

    const existingIssue = await prisma.issue.findUnique({
      where: { caseId },
    });

    exists = !!existingIssue;
  }

  return caseId;
}

function isCitizen(user) {
  return user && user.role === ROLES.CITIZEN;
}

function isStaff(user) {
  return user && user.role === ROLES.STAFF;
}

function isAdmin(user) {
  return user && user.role === ROLES.ADMIN;
}

function isStaffOrAdmin(user) {
  return isStaff(user) || isAdmin(user);
}

function buildIssuePhotoPath(firebaseUid, caseId) {
  return `issuePhotos/${firebaseUid}/${caseId}/report.jpg`;
}

function getStatusChangeComment(fromStatus, toStatus) {
  return `Status changed from ${fromStatus} to ${toStatus}`;
}

function getCategoryChangeComment(fromCategoryName, toCategoryName) {
  const previousLabel = fromCategoryName || "Uncategorised";
  const nextLabel = toCategoryName || "Uncategorised";
  return `Category changed from ${previousLabel} to ${nextLabel}`;
}

function getAssignmentComment(previousAssigneeName, nextAssigneeName) {
  if (!nextAssigneeName) {
    return previousAssigneeName
      ? `Issue unassigned from ${previousAssigneeName}`
      : "Issue unassigned";
  }

  if (!previousAssigneeName) {
    return `Issue assigned to ${nextAssigneeName}`;
  }

  return `Issue reassigned from ${previousAssigneeName} to ${nextAssigneeName}`;
}

router.post("/", auth, async (req, res) => {
  try {
    if (!isCitizen(req.user)) {
      return res.status(403).json({ message: "Only citizens can create issues" });
    }

    const {
      title,
      description,
      categoryId,
      addressLine1,
      addressLine2,
      suburb,
      area,
      city,
      county,
      latitude,
      longitude,
    } = req.body;

    const resolvedCity = city?.trim() || "Dublin";
    const resolvedCounty = county?.trim() || "Dublin";
    const parsedCategoryId = Number(categoryId);

    if (
      !title ||
      !description ||
      !parsedCategoryId ||
      !addressLine1 ||
      !resolvedCity ||
      !resolvedCounty
    ) {
      return res.status(400).json({
        message: "Title, description, category, address, city and county are required",
      });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: parsedCategoryId },
    });

    if (!existingCategory) {
      return res.status(400).json({ message: "Invalid category selected" });
    }

    const caseId = await generateUniqueCaseId();

    const issue = await prisma.$transaction(async (tx) => {
      const newIssue = await tx.issue.create({
        data: {
          caseId,
          title,
          description,
          categoryId: parsedCategoryId,
          addressLine1,
          addressLine2: addressLine2 || null,
          suburb: suburb || null,
          area: area || null,
          city: resolvedCity,
          county: resolvedCounty,
          latitude: typeof latitude === "number" ? latitude : null,
          longitude: typeof longitude === "number" ? longitude : null,
          citizenId: req.user.id,
        },
        include: {
          category: true,
        },
      });

      await tx.issueHistory.create({
        data: {
          issueId: newIssue.id,
          eventType: ISSUE_EVENT_TYPE.CREATED,
          toStatus: ISSUE_STATUS.CREATED,
          changedByUserId: req.user.id,
          comment: "Issue created",
        },
      });

      return newIssue;
    });

    return res.status(201).json({
      message: "Issue created successfully",
      issue,
    });
  } catch (error) {
    console.error("Create issue error:", error);
    return res.status(500).json({
      message: "Failed to create issue",
      details: error.message,
    });
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    if (!isCitizen(req.user)) {
      return res.status(403).json({ message: "Only citizens can view their own issues" });
    }

    const { search, status, category, sort } = req.query;
    const normalizedStatus =
      status && ALL_ISSUE_STATUSES.includes(String(status)) ? String(status) : undefined;

    const where = {
      citizenId: req.user.id,
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(category
        ? {
            category: {
              name: String(category),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: String(search) } },
              { description: { contains: String(search) } },
              { caseId: { contains: String(search) } },
              { addressLine1: { contains: String(search) } },
              { addressLine2: { contains: String(search) } },
              { suburb: { contains: String(search) } },
              { area: { contains: String(search) } },
              { city: { contains: String(search) } },
              { county: { contains: String(search) } },
            ],
          }
        : {}),
    };

    const orderBy = sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

    const issues = await prisma.issue.findMany({
      where,
      orderBy,
      include: {
        category: true,
      },
    });

    return res.status(200).json({
      issues,
    });
  } catch (error) {
    console.error("Get my issues error:", error);
    return res.status(500).json({
      message: "Failed to fetch user issues",
      details: error.message,
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    if (!isStaffOrAdmin(req.user)) {
      return res.status(403).json({ message: "Only staff can view all issues" });
    }

    const { search, status, category, sort, assignment } = req.query;

    const normalizedStatus =
      status && ALL_ISSUE_STATUSES.includes(String(status)) ? String(status) : undefined;

    const normalizedAssignment =
      assignment && ["all", "mine", "unassigned"].includes(String(assignment))
        ? String(assignment)
        : "all";

    const where = {
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(category
        ? {
            category: {
              name: String(category),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: String(search) } },
              { description: { contains: String(search) } },
              { caseId: { contains: String(search) } },
              { addressLine1: { contains: String(search) } },
              { addressLine2: { contains: String(search) } },
              { suburb: { contains: String(search) } },
              { area: { contains: String(search) } },
              { city: { contains: String(search) } },
              { county: { contains: String(search) } },
            ],
          }
        : {}),
    };

    if (normalizedAssignment === "mine") {
      if (!req.user?.staffProfile?.id) {
        return res.status(400).json({
          message: "Current user does not have a staff profile",
        });
      }

      where.staffId = req.user.staffProfile.id;
    }

    if (normalizedAssignment === "unassigned") {
      where.staffId = null;
    }

    let orderBy = { createdAt: "desc" };

    if (sort === "oldest") {
      orderBy = { createdAt: "asc" };
    }

    if (sort === "updated") {
      orderBy = { updatedAt: "desc" };
    }

    const issues = await prisma.issue.findMany({
      where,
      orderBy,
      include: {
        category: true,
        citizen: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        staff: {
          select: {
            id: true,
            jobTitle: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      issues,
    });
  } catch (error) {
    console.error("Get all issues error:", error);
    return res.status(500).json({
      message: "Failed to fetch issues",
      details: error.message,
    });
  }
});

router.get("/public-stats/summary", async (req, res) => {
  try {
    const [totalIssues, resolvedIssues, closedHistoryItems] = await Promise.all([
      prisma.issue.count(),
      prisma.issue.count({
        where: {
          status: {
            in: [ISSUE_STATUS.RESOLVED, ISSUE_STATUS.CLOSED],
          },
        },
      }),
      prisma.issueHistory.findMany({
        where: {
          toStatus: {
            in: [ISSUE_STATUS.RESOLVED, ISSUE_STATUS.CLOSED],
          },
        },
        select: {
          issueId: true,
          changedAt: true,
        },
        orderBy: {
          changedAt: "asc",
        },
      }),
    ]);

    const firstClosedByIssueId = new Map();

    for (const item of closedHistoryItems) {
      if (!firstClosedByIssueId.has(item.issueId)) {
        firstClosedByIssueId.set(item.issueId, item.changedAt);
      }
    }

    const issueIds = Array.from(firstClosedByIssueId.keys());

    const closedIssues =
      issueIds.length > 0
        ? await prisma.issue.findMany({
            where: {
              id: {
                in: issueIds,
              },
            },
            select: {
              id: true,
              createdAt: true,
            },
          })
        : [];

    const closeDurationsMs = closedIssues
      .map((issue) => {
        const closedAt = firstClosedByIssueId.get(issue.id);
        if (!closedAt) return null;

        const createdAtMs = new Date(issue.createdAt).getTime();
        const closedAtMs = new Date(closedAt).getTime();
        const duration = closedAtMs - createdAtMs;

        return duration >= 0 ? duration : null;
      })
      .filter((value) => value !== null);

    const averageCloseMs =
      closeDurationsMs.length > 0
        ? closeDurationsMs.reduce((sum, value) => sum + value, 0) / closeDurationsMs.length
        : 0;

    const averageCloseDays = averageCloseMs / (1000 * 60 * 60 * 24);

    const resolutionRate = totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 0;

    return res.status(200).json({
      totalIssues,
      resolvedIssues,
      resolutionRate,
      averageCloseDays,
    });
  } catch (error) {
    console.error("Get public stats error:", error);
    return res.status(500).json({
      message: "Failed to fetch public stats",
      details: error.message,
    });
  }
});

router.get("/:caseId/photo-url", auth, async (req, res) => {
  try {
    const { caseId } = req.params;

    const issue = await prisma.issue.findUnique({
      where: { caseId },
      select: {
        caseId: true,
        citizenId: true,
        citizen: {
          select: {
            firebaseUid: true,
          },
        },
      },
    });

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (isCitizen(req.user) && issue.citizenId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!isCitizen(req.user) && !isStaffOrAdmin(req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!issue.citizen?.firebaseUid) {
      return res.status(404).json({ message: "Photo not found" });
    }

    const filePath = buildIssuePhotoPath(issue.citizen.firebaseUid, issue.caseId);
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).json({ message: "Photo not found" });
    }

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 15 * 60 * 1000,
    });

    return res.status(200).json({ url });
  } catch (error) {
    console.error("Get issue photo URL error:", error);
    return res.status(500).json({
      message: "Failed to get photo URL",
      details: error.message,
    });
  }
});

router.get("/:caseId", auth, async (req, res) => {
  try {
    const { caseId } = req.params;

    const issue = await prisma.issue.findUnique({
      where: { caseId },
      include: {
        category: true,
        citizen: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        staff: {
          select: {
            id: true,
            jobTitle: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        notes: {
          include: {
            staff: {
              select: {
                id: true,
                jobTitle: true,
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        history: {
          include: {
            changedByUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            changedAt: "asc",
          },
        },
      },
    });

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (isCitizen(req.user) && issue.citizenId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!isCitizen(req.user) && !isStaffOrAdmin(req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json({
      issue,
    });
  } catch (error) {
    console.error("Get issue error:", error);
    return res.status(500).json({
      message: "Failed to fetch issue",
      details: error.message,
    });
  }
});

router.patch("/:caseId/status", auth, async (req, res) => {
  try {
    if (!isStaffOrAdmin(req.user)) {
      return res.status(403).json({ message: "Only staff can update issue status" });
    }

    const { caseId } = req.params;
    const { status } = req.body;

    if (!status || !ALL_ISSUE_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const existingIssue = await prisma.issue.findUnique({
      where: { caseId },
      include: {
        category: true,
      },
    });

    if (!existingIssue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (existingIssue.status === status) {
      return res.status(200).json({
        message: "Issue status unchanged",
        issue: existingIssue,
      });
    }

    const issue = await prisma.$transaction(async (tx) => {
      const updatedIssue = await tx.issue.update({
        where: { caseId },
        data: { status },
        include: {
          category: true,
        },
      });

      await tx.issueHistory.create({
        data: {
          issueId: existingIssue.id,
          eventType: ISSUE_EVENT_TYPE.STATUS_CHANGED,
          fromStatus: existingIssue.status,
          toStatus: status,
          changedByUserId: req.user.id,
          comment: getStatusChangeComment(existingIssue.status, status),
        },
      });

      return updatedIssue;
    });

    return res.status(200).json({
      message: "Issue status updated successfully",
      issue,
    });
  } catch (error) {
    console.error("Update issue status error:", error);
    return res.status(500).json({
      message: "Failed to update issue status",
      details: error.message,
    });
  }
});

router.patch("/:caseId/category", auth, async (req, res) => {
  try {
    if (!isStaffOrAdmin(req.user)) {
      return res.status(403).json({ message: "Only staff can update issue category" });
    }

    const { caseId } = req.params;
    const parsedCategoryId = Number(req.body.categoryId);

    if (!parsedCategoryId) {
      return res.status(400).json({ message: "A valid category is required" });
    }

    const [existingIssue, nextCategory] = await Promise.all([
      prisma.issue.findUnique({
        where: { caseId },
        include: {
          category: true,
        },
      }),
      prisma.category.findUnique({
        where: { id: parsedCategoryId },
      }),
    ]);

    if (!existingIssue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (!nextCategory || !nextCategory.isActive) {
      return res.status(400).json({ message: "Invalid category selected" });
    }

    if (existingIssue.categoryId === parsedCategoryId) {
      return res.status(200).json({
        message: "Issue category unchanged",
        issue: existingIssue,
      });
    }

    const issue = await prisma.$transaction(async (tx) => {
      const updatedIssue = await tx.issue.update({
        where: { caseId },
        data: {
          categoryId: parsedCategoryId,
        },
        include: {
          category: true,
        },
      });

      await tx.issueHistory.create({
        data: {
          issueId: existingIssue.id,
          eventType: ISSUE_EVENT_TYPE.NOTE_ADDED,
          changedByUserId: req.user.id,
          comment: getCategoryChangeComment(existingIssue.category?.name, nextCategory.name),
        },
      });

      return updatedIssue;
    });

    return res.status(200).json({
      message: "Issue category updated successfully",
      issue,
    });
  } catch (error) {
    console.error("Update issue category error:", error);
    return res.status(500).json({
      message: "Failed to update issue category",
      details: error.message,
    });
  }
});

router.post("/:caseId/notes", auth, async (req, res) => {
  try {
    if (!isStaffOrAdmin(req.user)) {
      return res.status(403).json({ message: "Only staff can add notes" });
    }

    if (!req.user?.staffProfile?.id) {
      return res.status(400).json({ message: "Current user does not have a staff profile" });
    }

    const { caseId } = req.params;
    const content = String(req.body.content || "").trim();

    if (!content) {
      return res.status(400).json({ message: "Note content is required" });
    }

    const existingIssue = await prisma.issue.findUnique({
      where: { caseId },
    });

    if (!existingIssue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.note.create({
        data: {
          content,
          issueId: existingIssue.id,
          staffId: req.user.staffProfile.id,
        },
      });

      await tx.issue.update({
        where: { id: existingIssue.id },
        data: {
          updatedAt: new Date(),
        },
      });

      await tx.issueHistory.create({
        data: {
          issueId: existingIssue.id,
          eventType: ISSUE_EVENT_TYPE.NOTE_ADDED,
          changedByUserId: req.user.id,
          comment: `Staff note added: ${content}`,
        },
      });
    });

    const issue = await prisma.issue.findUnique({
      where: { caseId },
      include: {
        category: true,
      },
    });

    return res.status(201).json({
      message: "Staff note saved successfully",
      issue,
    });
  } catch (error) {
    console.error("Add issue note error:", error);
    return res.status(500).json({
      message: "Failed to save staff note",
      details: error.message,
    });
  }
});

router.patch("/:caseId/assignment", auth, async (req, res) => {
  try {
    if (!isStaffOrAdmin(req.user)) {
      return res.status(403).json({ message: "Only staff can assign issues" });
    }

    const { caseId } = req.params;
    const rawStaffId = req.body.staffId;
    const nextStaffId = rawStaffId === null ? null : Number(rawStaffId);

    if (rawStaffId !== null && !nextStaffId) {
      return res.status(400).json({ message: "A valid staff member is required" });
    }

    const existingIssue = await prisma.issue.findUnique({
      where: { caseId },
      include: {
        staff: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!existingIssue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    let nextStaff = null;

    if (nextStaffId) {
      nextStaff = await prisma.staff.findUnique({
        where: { id: nextStaffId },
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
      });

      if (!nextStaff || !nextStaff.user?.isActive) {
        return res.status(400).json({ message: "Selected staff member is not available" });
      }
    }

    if ((existingIssue.staff?.id || null) === (nextStaff?.id || null)) {
      return res.status(200).json({
        message: "Issue assignment unchanged",
        issue: existingIssue,
      });
    }

    const eventType = nextStaff ? ISSUE_EVENT_TYPE.ASSIGNED : ISSUE_EVENT_TYPE.UNASSIGNED;
    const previousAssigneeName = existingIssue.staff?.user?.fullName || null;
    const nextAssigneeName = nextStaff?.user?.fullName || null;

    const issue = await prisma.$transaction(async (tx) => {
      const updatedIssue = await tx.issue.update({
        where: { caseId },
        data: {
          staffId: nextStaff?.id || null,
        },
        include: {
          category: true,
          staff: {
            select: {
              id: true,
              jobTitle: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      await tx.issueHistory.create({
        data: {
          issueId: existingIssue.id,
          eventType,
          changedByUserId: req.user.id,
          comment: getAssignmentComment(previousAssigneeName, nextAssigneeName),
        },
      });

      return updatedIssue;
    });

    return res.status(200).json({
      message: nextStaff ? "Issue assigned successfully" : "Issue unassigned successfully",
      issue,
    });
  } catch (error) {
    console.error("Update issue assignment error:", error);
    return res.status(500).json({
      message: "Failed to update assignment",
      details: error.message,
    });
  }
});

module.exports = router;
