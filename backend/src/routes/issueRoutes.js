const express = require("express");
const prisma = require("../lib/prisma");
const auth = require("../middleware/auth");
const generateCaseId = require("../utils/generateCaseId");

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
  return user && user.role === "CITIZEN";
}

function isStaff(user) {
  return user && user.role === "STAFF";
}

router.post("/", auth, async (req, res) => {
  try {
    if (!isCitizen(req.user)) {
      return res.status(403).json({ message: "Only citizens can create issues" });
    }

    const { title, description, category, location } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const caseId = await generateUniqueCaseId();

    const issue = await prisma.issue.create({
      data: {
        caseId,
        title,
        description,
        category,
        location,
        citizenId: req.user.id,
      },
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

    const where = {
      citizenId: req.user.id,
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
              { caseId: { contains: search } },
              { location: { contains: search } },
            ],
          }
        : {}),
    };

    const orderBy = sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

    const issues = await prisma.issue.findMany({
      where,
      orderBy,
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

    const where = {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
              { caseId: { contains: search } },
              { location: { contains: search } },
            ],
          }
        : {}),
    };

    const orderBy = sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

    const issues = await prisma.issue.findMany({
      where,
      orderBy,
      include: {
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
        citizen: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        notes: {
          include: {
            staffUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
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

    const allowedStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const existingIssue = await prisma.issue.findUnique({
      where: { caseId },
    });

    if (!existingIssue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const issue = await prisma.issue.update({
      where: { caseId },
      data: { status },
    });

    return res.status(200).json({
      message: "Issue status updated successfully",
      issue,
    });
  } catch (error) {
    console.error("Update status error:", error);
    return res.status(500).json({
      message: "Failed to update issue status",
      details: error.message,
    });
  }
});

router.post("/:caseId/notes", auth, async (req, res) => {
  try {
    if (!isStaff(req.user)) {
      return res.status(403).json({ message: "Only staff can add notes" });
    }

    const { caseId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Note content is required" });
    }

    const issue = await prisma.issue.findUnique({
      where: { caseId },
    });

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const note = await prisma.note.create({
      data: {
        content: content.trim(),
        issueId: issue.id,
        staffUserId: req.user.id,
      },
      include: {
        staffUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Note added successfully",
      note,
    });
  } catch (error) {
    console.error("Add note error:", error);
    return res.status(500).json({
      message: "Failed to add note",
      details: error.message,
    });
  }
});

module.exports = router;