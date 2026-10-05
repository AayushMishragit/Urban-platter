const { Schema, model } = require("mongoose");

const auditLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    summary: { type: String, default: "" },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

auditLogSchema.index({ organization: 1, timestamp: -1 });
auditLogSchema.index({ organization: 1, entity: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ organization: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ organization: 1, user: 1, timestamp: -1 });
auditLogSchema.index({ organization: 1, summary: "text" });

module.exports = model("AuditLog", auditLogSchema);
