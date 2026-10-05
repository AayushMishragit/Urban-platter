const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

module.exports = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) throw ApiError.unauthorized("Missing token");

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    if (err.name === "TokenExpiredError") throw ApiError.unauthorized("Token expired", "TOKEN_EXPIRED");
    throw ApiError.unauthorized("Invalid token");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized("Invalid token");

  req.user = user;
  next();
});
