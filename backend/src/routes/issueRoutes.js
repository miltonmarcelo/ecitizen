const express = require("express");
const prisma = require("../lib/prisma");
const auth = require("../middleware/auth");
const generateCaseId = require("../utils/generateCaseId");
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
      town,
      city,
      county,
      latitude,
      longitude,
    } = req.body;

    const parsedCategoryId = Number(categoryId);

    if (
      !title ||
      !description ||
      !parsedCategoryId ||
      !addressLine1 ||
      !city ||
      !county
    ) {
      return res.status(400).json({ message: "Title, description, category, address, city and county are required" });
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
          town: town || null,
          city,
          county,
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
              { town: { contains: String(search) } },
              { city: { contains: String(search) } },
              { county: { contains: String(search) } },
              { eircode: { contains: String(search) } },
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
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Only staff can view all issues" });
    }

    const { search, status, category, sort } = req.query;
    const normalizedStatus =
      status && ALL_ISSUE_STATUSES.includes(String(status)) ? String(status) : undefined;

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
              { town: { contains: String(search) } },
              { city: { contains: String(search) } },
              { county: { contains: String(search) } },
              { eircode: { contains: String(search) } },
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
        citizen: {
          select: {
            id: true,
            fullName: true,
            email: true,
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
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Only staff can update issue status" });
    }

    const { caseId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "CREATED",
      "UNDER_REVIEW",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
      "CANCELLED",
    ];

    if (!status || !allowedStatuses.includes(status)) {
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
          eventType: "STATUS_CHANGED",
          fromStatus: existingIssue.status,
          toStatus: status,
          changedByUserId: req.user.id,
          comment: `Status changed from ${existingIssue.status} to ${status}`,
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

module.exports = router;
