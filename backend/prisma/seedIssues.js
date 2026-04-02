const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();

  const categoryMap = Object.fromEntries(
    categories.map((category) => [category.name, category.id])
  );

  const dummyIssues = [
    {
      caseId: "EC202600001",
      title: "Pothole on Main Street",
      description:
        "Large pothole causing disruption to traffic and creating a safety risk for cars and bicycles.",
      categoryName: "Potholes",
      status: "CREATED",
      addressLine1: "12 Main Street",
      addressLine2: null,
      town: "Ranelagh",
      city: "Dublin",
      county: "Dublin",
      eircode: "D06 A1B2",
      citizenId: 3,
    },
    {
      caseId: "EC202600002",
      title: "Broken street light near corner",
      description:
        "Street light has not been working for several nights and the area is very dark.",
      categoryName: "Street Lighting",
      status: "UNDER_REVIEW",
      addressLine1: "45 Oak Avenue",
      addressLine2: null,
      town: "Dundrum",
      city: "Dublin",
      county: "Dublin",
      eircode: "D14 C3D4",
      citizenId: 3,
    },
    {
      caseId: "EC202600003",
      title: "Overflowing bins in public area",
      description:
        "Bins are completely full and rubbish is now spreading onto the pavement.",
      categoryName: "Waste Collection",
      status: "IN_PROGRESS",
      addressLine1: "8 River Road",
      addressLine2: "Near park entrance",
      town: "Rathmines",
      city: "Dublin",
      county: "Dublin",
      eircode: "D06 E5F6",
      citizenId: 3,
    },
    {
      caseId: "EC202600004",
      title: "Water leak on footpath",
      description:
        "Water has been leaking continuously since yesterday and the surface is becoming slippery.",
      categoryName: "Flooding",
      status: "RESOLVED",
      addressLine1: "27 Green Lane",
      addressLine2: null,
      town: "Ballsbridge",
      city: "Dublin",
      county: "Dublin",
      eircode: "D04 G7H8",
      citizenId: 3,
    },
    {
      caseId: "EC202600005",
      title: "Damaged bench in playground",
      description:
        "A wooden bench in the playground is broken and could be unsafe for families using the park.",
      categoryName: "Parks and Green Areas",
      status: "CLOSED",
      addressLine1: "Merrion Square Park",
      addressLine2: null,
      town: "Dublin 2",
      city: "Dublin",
      county: "Dublin",
      eircode: "D02 J1K2",
      citizenId: 3,
    },
    {
      caseId: "EC202600006",
      title: "Blocked drainage after rain",
      description:
        "Drainage appears blocked and rainwater is collecting heavily on the road after light rainfall.",
      categoryName: "Flooding",
      status: "CREATED",
      addressLine1: "16 Cedar Close",
      addressLine2: null,
      town: "Tallaght",
      city: "Dublin",
      county: "Dublin",
      eircode: "D24 L3M4",
      citizenId: 3,
    },
    {
      caseId: "EC202600007",
      title: "Illegal dumping beside apartments",
      description:
        "Several black bags and household waste have been left beside the apartment entrance.",
      categoryName: "Illegal Dumping",
      status: "UNDER_REVIEW",
      addressLine1: "22 Willow Court",
      addressLine2: "Apartment block side gate",
      town: "Clondalkin",
      city: "Dublin",
      county: "Dublin",
      eircode: "D22 N5P6",
      citizenId: 3,
    },
    {
      caseId: "EC202600008",
      title: "Traffic light timing issue",
      description:
        "Pedestrian crossing time is too short and elderly pedestrians are struggling to cross safely.",
      categoryName: "Road Signs",
      status: "IN_PROGRESS",
      addressLine1: "Harold's Cross Road",
      addressLine2: "At the main junction",
      town: "Harold's Cross",
      city: "Dublin",
      county: "Dublin",
      eircode: "D06 Q7R8",
      citizenId: 3,
    },
    {
      caseId: "EC202600009",
      title: "Road surface breaking up",
      description:
        "The road surface is cracking badly and loose material is spreading across the lane.",
      categoryName: "Potholes",
      status: "RESOLVED",
      addressLine1: "5 Brookfield Terrace",
      addressLine2: null,
      town: "Sandyford",
      city: "Dublin",
      county: "Dublin",
      eircode: "D18 S9T1",
      citizenId: 3,
    },
    {
      caseId: "EC202600010",
      title: "Graffiti on public wall",
      description:
        "Large graffiti markings have appeared on the public wall beside the bus stop.",
      categoryName: "Graffiti",
      status: "CANCELLED",
      addressLine1: "11 Station Road",
      addressLine2: "Beside bus shelter",
      town: "Raheny",
      city: "Dublin",
      county: "Dublin",
      eircode: "D05 U2V3",
      citizenId: 3,
    },
  ];

  for (const issue of dummyIssues) {
    const categoryId = categoryMap[issue.categoryName];

    if (!categoryId) {
      throw new Error(`Category not found: ${issue.categoryName}`);
    }

    const { categoryName, ...issueData } = issue;

    await prisma.issue.upsert({
      where: { caseId: issue.caseId },
      update: {
        ...issueData,
        categoryId,
      },
      create: {
        ...issueData,
        categoryId,
      },
    });
  }

  console.log("10 dummy issues inserted successfully");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });