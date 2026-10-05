class ApiError extends Error {
  constructor(status, message, code = "ERROR", details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(msg, details) { return new ApiError(400, msg, "BAD_REQUEST", details); }
  static unauthorized(msg = "Unauthorized", code = "UNAUTHORIZED") { return new ApiError(401, msg, code); }
  static forbidden(msg = "Forbidden") { return new ApiError(403, msg, "FORBIDDEN"); }
  static notFound(msg = "Not found") { return new ApiError(404, msg, "NOT_FOUND"); }
  static conflict(msg) { return new ApiError(409, msg, "CONFLICT"); }
}

module.exports = ApiError;
