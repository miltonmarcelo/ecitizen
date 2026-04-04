const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const categories = [
    {
      name: "Potholes",
      description: "Road surface damage such as potholes or cracks",
    },
    {
      name: "Street Lighting",
      description: "Broken or faulty public lighting",
    },
    {
      name: "Graffiti",
      description: "Graffiti or vandalism on public property",
    },
    {
      name: "Illegal Dumping",
      description: "Waste dumped in public areas",
    },
    {
      name: "Flooding",
      description: "Flooding or drainage related issues",
    },
    {
      name: "Waste Collection",
      description: "Missed collection or waste related public issue",
    },
    {
      name: "Road Signs",
      description: "Damaged or missing road signs",
    },
    {
      name: "Footpaths",
      description: "Damaged footpaths or pavement issues",
    },
    {
      name: "Parks and Green Areas",
      description: "Issues in parks or public green spaces",
    },
    {
      name: "Other",
      description: "Any issue that does not fit existing categories",
    },
    {
      name: "Hazards",
      description: "Critical safety issues",
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {
        description: category.description,
        isActive: true,
      },
      create: {
        name: category.name,
        description: category.description,
        isActive: true,
      },
    });
  }

  console.log("Categories seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Error seeding categories:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });