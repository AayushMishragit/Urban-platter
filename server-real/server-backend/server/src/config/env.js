const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const required = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env var ${key}`);
  }
}

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  deadlineWindowHours: Number(process.env.DEADLINE_WINDOW_HOURS) || 24,
  deadlineCheckMinutes: Number(process.env.DEADLINE_CHECK_MINUTES) || 5,
};
