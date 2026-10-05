const { ZodError } = require("zod");
const ApiError = require("../utils/ApiError");

exports.notFound = (req, res) =>
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });

exports.errorHandler = (err, req, res, next) => {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong";
  let details;

  if (err instanceof ApiError) {
    ({ status, code, message, details } = err);
  } else if (err instanceof ZodError) {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Invalid request";
    details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    code = "INVALID_JSON";
    message = "Malformed JSON body";
  } else if (err.name === "CastError") {
    status = 400;
    code = "INVALID_ID";
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    code = "CONFLICT";
    message = "Duplicate value";
  } else {
    console.error(err);
  }

  res.status(status).json({ error: { code, message, ...(details && { details }) } });
};
