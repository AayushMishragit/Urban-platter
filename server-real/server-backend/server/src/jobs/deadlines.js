const Task = require("../models/Task");
const env = require("../config/env");
const { notify } = require("../services/notify");

const run = async () => {
  const now = new Date();
  const until = new Date(now.getTime() + env.deadlineWindowHours * 3600 * 1000);

  const tasks = await Task.find({
    dueDate: { $gt: now, $lte: until },
    status: { $ne: "DONE" },
    assignee: { $ne: null },
  })
    .select("title assignee dueDate organization")
    .limit(1000)
    .lean();

  for (const t of tasks) {
    await notify([t.assignee], {
      organization: t.organization,
      type: "DEADLINE_APPROACHING",
      message: `"${t.title}" is due soon`,
      entity: "Task",
      entityId: t._id,
      dedupeKey: `deadline:${t._id}:${t.dueDate.getTime()}`,
    });
  }
};

exports.run = run;

exports.start = () => {
  const timer = setInterval(() => run().catch((e) => console.error("deadline job failed:", e.message)), env.deadlineCheckMinutes * 60 * 1000);
  return () => clearInterval(timer);
};
