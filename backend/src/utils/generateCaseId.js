const crypto = require("crypto");

function generateCaseId() {
  const year = new Date().getFullYear();
  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `EC${year}${randomPart}`;
}

module.exports = generateCaseId;