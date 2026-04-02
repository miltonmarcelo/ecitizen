const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Harzards", description: "Critical safety issues" },

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