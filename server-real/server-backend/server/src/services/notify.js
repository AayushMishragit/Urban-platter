const Notification = require("../models/Notification");
const realtime = require("./realtime");

// recipients: user ids; the actor is skipped so people aren't notified about their own actions
exports.notify = async (recipients, data, actorId) => {
  const ids = [...new Set(recipients.filter(Boolean).map(String))].filter((id) => id !== String(actorId));

  for (const user of ids) {
    try {
      const n = await Notification.create({
        ...data,
        user,
        dedupeKey: data.dedupeKey ? `${data.dedupeKey}:${user}` : undefined,
      });
      realtime.emitToUser(user, "notification:new", n);
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }
};
