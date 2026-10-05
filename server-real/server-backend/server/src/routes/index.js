const router = require("express").Router();
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const s = require("../validators/schemas");

const authC = require("../controllers/auth.controller");
const orgC = require("../controllers/organization.controller");
const projectC = require("../controllers/project.controller");
const taskC = require("../controllers/task.controller");
const commentC = require("../controllers/comment.controller");
const auditC = require("../controllers/audit.controller");
const notifC = require("../controllers/notification.controller");

router.get("/health", (req, res) => res.json({ ok: true }));

router.post("/auth/register", validate(s.register), authC.register);
router.post("/auth/login", validate(s.login), authC.login);
router.get("/auth/me", auth, authC.me);

router.use(auth);

router.post("/organizations", validate(s.createOrg), orgC.create);
router.get("/organizations", orgC.list);
router.get("/organizations/:id/members", orgC.listMembers);
router.post("/organizations/:id/members", validate(s.addMember), orgC.addMember);
router.delete("/organizations/:id/members/:userId", orgC.removeMember);

router.post("/projects", validate(s.createProject), projectC.create);
router.get("/projects", validate(s.listProjects, "query"), projectC.list);
router.get("/projects/:id", projectC.get);
router.put("/projects/:id", validate(s.updateProject), projectC.update);
router.delete("/projects/:id", projectC.remove);

router.post("/tasks", validate(s.createTask), taskC.create);
router.get("/tasks", validate(s.searchTasks, "query"), taskC.list);
router.get("/tasks/:id", taskC.get);
router.put("/tasks/:id", validate(s.updateTask), taskC.update);
router.delete("/tasks/:id", taskC.remove);
router.post("/tasks/:id/comments", validate(s.createComment), commentC.create);
router.get("/tasks/:id/comments", validate(s.listComments, "query"), commentC.list);

router.get("/audit-logs", validate(s.auditQuery, "query"), auditC.list);

router.get("/notifications", validate(s.notificationQuery, "query"), notifC.list);
router.patch("/notifications/read-all", notifC.markAllRead);
router.patch("/notifications/:id/read", notifC.markRead);

module.exports = router;
