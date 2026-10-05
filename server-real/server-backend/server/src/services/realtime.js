const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const Project = require("../models/Project");
const { getRole } = require("./access");

let io = null;

exports.init = (httpServer) => {
  io = new Server(httpServer, { cors: { origin: env.clientUrl } });

  io.use((socket, next) => {
    try {
      const payload = jwt.verify(socket.handshake.auth?.token, env.jwtSecret);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);

    socket.on("project:join", async (projectId, ack) => {
      try {
        const project = await Project.findById(projectId).select("organization").lean();
        const role = project && (await getRole(socket.data.userId, project.organization));
        if (!role) return ack?.({ ok: false, error: "Project not found" });
        socket.join(`project:${projectId}`);
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false, error: "Invalid project" });
      }
    });

    socket.on("project:leave", (projectId) => socket.leave(`project:${projectId}`));
  });

  return io;
};

exports.emitToProject = (projectId, event, payload) => io?.to(`project:${projectId}`).emit(event, payload);
exports.emitToUser = (userId, event, payload) => io?.to(`user:${userId}`).emit(event, payload);
