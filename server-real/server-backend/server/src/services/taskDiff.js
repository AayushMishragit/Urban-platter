const TRACKED = {
  title: "TASK_UPDATED",
  description: "TASK_UPDATED",
  labels: "TASK_UPDATED",
  status: "TASK_STATUS_CHANGED",
  priority: "TASK_PRIORITY_CHANGED",
  assignee: "TASK_ASSIGNEE_CHANGED",
  dueDate: "TASK_DUE_DATE_CHANGED",
};

const norm = (field, v) => {
  if (v == null) return null;
  if (field === "dueDate") return new Date(v).getTime();
  if (field === "labels") return JSON.stringify(v);
  return String(v);
};

exports.diff = (oldTask, updates) =>
  Object.keys(TRACKED)
    .filter((f) => f in updates && norm(f, oldTask[f]) !== norm(f, updates[f]))
    .map((f) => ({
      field: f,
      action: TRACKED[f],
      oldValue: oldTask[f] ?? null,
      newValue: updates[f] ?? null,
    }));
