const http = require("http");
const mongoose = require("mongoose");
const env = require("./src/config/env");
const connectDB = require("./src/config/db");
const app = require("./src/app");
const realtime = require("./src/services/realtime");
const deadlines = require("./src/jobs/deadlines");

const server = http.createServer(app);
realtime.init(server);

connectDB()
  .then(() => {
    const stopJob = deadlines.start();
    server.listen(env.port, () => console.log(`API running on :${env.port}`));

    const shutdown = () => {
      stopJob();
      server.close(() => mongoose.disconnect().then(() => process.exit(0)));
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  })
  .catch((err) => {
    console.error("Startup failed:", err.message);
    process.exit(1);
  });
