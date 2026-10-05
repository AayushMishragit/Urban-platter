const { Schema, model } = require("mongoose");

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organization: { type: Schema.Types.ObjectId, ref: "Organization" },
    type: {
      type: String,
      enum: ["TASK_ASSIGNED", "COMMENT_MENTION", "TASK_STATUS_CHANGED", "DEADLINE_APPROACHING", "ORG_ADDED"],
      required: true,
    },
    message: { type: String, required: true },
    entity: String,
    entityId: Schema.Types.ObjectId,
    read: { type: Boolean, default: false },
    dedupeKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = model("Notification", notificationSchema);
