const AuditLog = require("../models/AuditLog");

exports.log = (entry) => AuditLog.create(entry);
