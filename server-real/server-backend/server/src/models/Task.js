const { Schema, model } = require("mongoose");

const taskSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"], default: "TODO" },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" },
    assignee: { type: Schema.Types.ObjectId, ref: "User", default: null },
    dueDate: { type: Date, default: null },
    labels: { type: [String], default: [] },
    attachments: [{ _id: false, name: String, url: String, size: Number }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    position: { type: Number, default: () => Date.now() },
  },
  { timestamps: true }
);

taskSchema.index({ organization: 1, project: 1, status: 1, position: 1 });
taskSchema.index({ organization: 1, assignee: 1, status: 1 });
taskSchema.index({ organization: 1, dueDate: 1 });
taskSchema.index({ organization: 1, createdAt: -1 });
taskSchema.index({ organization: 1, labels: 1 });
taskSchema.index({ organization: 1, title: "text", description: "text" });
taskSchema.index({ dueDate: 1 });

module.exports = model("Task", taskSchema);
