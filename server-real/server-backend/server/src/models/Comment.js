const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
  {
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

commentSchema.index({ task: 1, createdAt: 1 });

module.exports = model("Comment", commentSchema);
