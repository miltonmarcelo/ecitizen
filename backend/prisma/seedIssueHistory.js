const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CITIZEN_USER_ID = 3;
const STAFF_USER_ID = 5;

const issueHistoryTemplates = {
  CREATED: [
    {
      eventType: "CREATED",
      fromStatus: null,
      toStatus: "CREATED",
      comment: "Issue submitted by citizen",
      changedByUserId: CITIZEN_USER_ID,
      daysAgo: 10,
    },
  ],

  UNDER_REVIEW: [
    {
      eventType: "CREATED",
      fromStatus: null,
      toStatus: "CREATED",
      comment: "Issue submitted by citizen",
      changedByUserId: CITIZEN_USER_ID,
      daysAgo: 9,
    },
    {
      eventType: "STATUS_CHANGED",
      fromStatus: "CREATED",
      toStatus: "UNDER_REVIEW",
      comment: "Issue moved to under review by staff",
      changedByUserId: STAFF_USER_ID,
      daysAgo: 8,
    },
  ],

  IN_PROGRESS: [
    {
      eventType: "CREATED",
      fromStatus: null,
      toStatus: "CREATED",
      comment: "Issue submitted by citizen",
      changedByUserId: CITIZEN_USER_ID,
      daysAgo: 9,
    },
    {
      eventType: "STATUS_CHANGED",
      fromStatus: "CREATED",
      toStatus: "UNDER_REVIEW",
      comment: "Issue reviewed by staff",
      changedByUserId: STAFF_USER_ID,
      daysAgo: 8,
    },
    {
      eventType: "STATUS_CHANGED",
      fromStatus: "UNDER_REVIEW",
      toStatus: "IN_PROGRESS",
      comment: "Work started on this issue",
      changedByUserId: STAFF_USER_ID,
      daysAgo: 6,
    },
  ],

  RESOLVED: [
    {
      eventType: "CREATED",
      fromStatus: null,
      toStatus: "CREATED",
      comment: "Issue submitted by citizen",
      changedByUserId: CITIZEN_USER_ID,
      daysAgo: 12,
    },
    {
      eventType: "STATUS_CHANGED",
      fromStatus: "CREATED",
      toStatus: "UNDER_REVIEW",
      comment: "Issue reviewed by staff",
      changedByUserId: STAFF_USER_ID,
      daysAgo: 11,
    },
    {
      eventType: "STATUS_CHANGED",
      fromStatus: "UNDER_REVIEW",
      toStatus: "IN_PROGRESS",
      comment: "Maintenance work scheduled",
      changedByUserId: STAFF_USER_ID,
      daysAgo: 9,
    },
    {
      eventType: "STATUS_CHANGED",
      fromStatus: "IN_PROGRESS",
      toStatus: "RESOLVED",
      comment: "Issue resolved successfully",
      changedByUserId: STAFF_USER_ID,
      daysAgo: 4,
    },
  ],

  CLOSED: [
    {
      eventType: "CREATED",
      fromStatus: null,
      toStatus: "CREATED",
      comment: "Issue submitted by citizen",
      changedByUserId: CITIZEN_USER_ID,
      daysAgo: 14,
    },
    {
      eventType: "STATUS_CHANGED",
      fromStatus: "CREATED",
      toStatus: "UNDER_REVIEW",
      comment: "Issue reviewed by staff",
      changedByUserId: STAFF_USER_ID,
      daysAgo: 13,
    },
    {
      eventType: "STATUS_CHANGED",
      fromStatus: "UNDER_REVIEW",
      toStatus: "IN_PROGRESS",
      comment: "Repair work started",
      changedByUserId: STAFF_USER_ID,
      daysAgo: 11,
    },
    {
      eventType: "STATUS_CHANGED",
      fromStatus: "IN_PROGRESS",
      toStatus: "RESOLVED",
      comment: "Issue resolved successfully",
      changedByUserId: STAFF_USER_ID,
      daysAgo: 7,
    },
    {
      eventType: "STATUS_CHANGED",
      fromStatus: "RESOLVED",
      toStatus: "CLOSED",
      comment: "Case closed after final review",
      changedByUserId: STAFF_USER_ID,
      daysAgo: 3,
    },
  ],

  CANCELLED: [
    {
      eventType: "CREATED",
      fromStatus: null,
      toStatus: "CREATED",
      comment: "Issue submitted by citizen",
      changedByUserId: CITIZEN_USER_ID,
      daysAgo: 7,
    },
    {
      eventType: "STATUS_CHANGED",
      fromStatus: "CREATED",
      toStatus: "CANCELLED",
      comment: "Issue cancelled after validation",
      changedByUserId: STAFF_USER_ID,
      daysAgo: 5,
    },
  ],
};

function makeDate(daysAgo, hour = 10, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  const issues = await prisma.issue.findMany({
    where: {
      citizenId: CITIZEN_USER_ID,
    },
    orderBy: {
      caseId: "asc",
    },
  });

  if (!issues.length) {
    console.log("No issues found for citizenId = 3");
    return;
  }

  for (const issue of issues) {
    const templates = issueHistoryTemplates[issue.status];

    if (!templates) {
      console.log(`Skipping issue ${issue.caseId}. No template found for status ${issue.status}`);
      continue;
    }

    await prisma.issueHistory.deleteMany({
      where: { issueId: issue.id },
    });

    for (let i = 0; i < templates.length; i++) {
      const item = templates[i];

      await prisma.issueHistory.create({
        data: {
          issueId: issue.id,
          eventType: item.eventType,
          fromStatus: item.fromStatus,
          toStatus: item.toStatus,
          comment: item.comment,
          changedByUserId: item.changedByUserId,
          changedAt: makeDate(item.daysAgo, 10 + i, i * 5),
        },
      });
    }

    console.log(`History created for ${issue.caseId} with status ${issue.status}`);
  }

  console.log("Issue history seed completed successfully");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });