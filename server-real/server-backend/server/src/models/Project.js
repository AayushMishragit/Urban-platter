const { Schema, model } = require("mongoose");

const projectSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["ACTIVE", "ARCHIVED"], default: "ACTIVE" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

projectSchema.index({ organization: 1, createdAt: -1 });

module.exports = model("Project", projectSchema);
