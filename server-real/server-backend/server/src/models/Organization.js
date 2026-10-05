const { Schema, model } = require("mongoose");

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = model("Organization", organizationSchema);
