const admin = require("../config/firebaseAdmin");
const prisma = require("../lib/prisma");

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = header.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    req.firebaseUser = decoded;
    req.user = user || null;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized", details: error.message });
  }
}

module.exports = auth;