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

    let user = null;

    if (decoded.uid) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { firebaseUid: decoded.uid },
            ...(decoded.email ? [{ email: decoded.email }] : []),
          ],
        },
        include: {
          staffProfile: true,
        },
      });
    }

    if (user && user.isActive === false) {
      return res.status(403).json({
        message: "This account has been disabled",
      });
    }

    req.firebaseUser = decoded;
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      message: "Unauthorized",
      details: error.message,
    });
  }
}

module.exports = auth;