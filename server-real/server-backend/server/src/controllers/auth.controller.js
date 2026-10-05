const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const sign = (user) => jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw ApiError.conflict("Email already registered");

  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ user, token: sign(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select("+passwordHash");
  const ok = user && (await bcrypt.compare(req.body.password, user.passwordHash));
  if (!ok) throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");

  res.json({ user, token: sign(user) });
});

exports.me = (req, res) => res.json({ user: req.user });
