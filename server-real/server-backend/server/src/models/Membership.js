const { Schema, model } = require("mongoose");

const membershipSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["OWNER", "ADMIN", "MEMBER", "VIEWER"], required: true },
  },
  { timestamps: true }
);

membershipSchema.index({ organization: 1, user: 1 }, { unique: true });
membershipSchema.index({ user: 1 });

module.exports = model("Membership", membershipSchema);
