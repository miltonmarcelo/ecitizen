const admin = require("./src/config/firebaseAdmin");

async function test() {
  try {
    const app = admin.app();
    console.log("Firebase Admin loaded");
    console.log("Project ID:", app.options.projectId || "not directly set");
  } catch (error) {
    console.error("Firebase Admin failed:", error.message);
  }
}

test();
