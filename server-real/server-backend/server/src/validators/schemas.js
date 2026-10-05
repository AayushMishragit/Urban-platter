const { z } = require("zod");

const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const ROLES = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];
const STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const csv = (inner) =>
  z
    .string()
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(inner));

const paging = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
};

exports.register = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
});

exports.login = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
});

exports.createOrg = z.object({ name: z.string().trim().min(2).max(100) });

exports.addMember = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(ROLES),
});

exports.createProject = z.object({
  organizationId: id,
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional(),
});

exports.updateProject = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, "At least one field is required");

exports.listProjects = z.object({ organizationId: id, ...paging });

const taskFields = {
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000),
  status: z.enum(STATUSES),
  priority: z.enum(PRIORITIES),
  assignee: id.nullable(),
  dueDate: z.coerce.date().nullable(),
  labels: z.array(z.string().trim().min(1).max(30)).max(10),
  attachments: z
    .array(z.object({ name: z.string().max(200), url: z.string().url().max(2000), size: z.number().nonnegative().optional() }))
    .max(10),
};
const optional = Object.fromEntries(Object.entries(taskFields).map(([k, v]) => [k, v.optional()]));

exports.createTask = z.object({ ...optional, title: taskFields.title, projectId: id });

exports.updateTask = z
  .object({ ...optional, position: z.number().finite().optional() })
  .refine((o) => Object.keys(o).length > 0, "At least one field is required");

exports.searchTasks = z
  .object({
    organizationId: id.optional(),
    projectId: id.optional(),
    status: csv(z.enum(STATUSES)).optional(),
    priority: csv(z.enum(PRIORITIES)).optional(),
    assignee: z.union([id, z.enum(["me", "none"])]).optional(),
    labels: csv(z.string()).optional(),
    dueBefore: z.coerce.date().optional(),
    dueAfter: z.coerce.date().optional(),
    createdBefore: z.coerce.date().optional(),
    createdAfter: z.coerce.date().optional(),
    q: z.string().trim().min(1).max(100).optional(),
    sortBy: z.enum(["createdAt", "dueDate", "position"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
    ...paging,
  })
  .refine((o) => o.organizationId || o.projectId, "organizationId or projectId is required");

exports.createComment = z.object({
  body: z.string().trim().min(1).max(2000),
  mentions: z.array(id).max(20).optional(),
});

exports.listComments = z.object({ ...paging });

exports.auditQuery = z.object({
  organizationId: id,
  entity: z.string().max(50).optional(),
  entityId: id.optional(),
  action: z.string().max(60).optional(),
  user: id.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().trim().min(1).max(100).optional(),
  ...paging,
});

exports.notificationQuery = z.object({
  unread: z.enum(["true", "false"]).optional(),
  ...paging,
});
