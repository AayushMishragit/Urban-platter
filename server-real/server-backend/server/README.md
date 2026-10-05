# AtlasDesk Backend (Task 2: Multi-Tenant Project Management)

## Run
```
cp .env.example .env      # set MONGO_URI + JWT_SECRET
docker compose up -d      # optional local MongoDB
npm install
npm run dev               # http://localhost:5000/api/health
npm test                  # unit + no-DB http tests; integration runs when MONGO_URI_TEST is set
```

## Env
PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL, DEADLINE_WINDOW_HOURS, DEADLINE_CHECK_MINUTES, MONGO_URI_TEST (tests only)

## Architecture
`routes -> validate (zod) -> controller -> services/models`. Auth middleware loads the user from the JWT; `services/access.js` resolves the caller's org role and `services/permissions.js` maps role -> permission. Every endpoint checks the role server-side. Org is always derived from the project/task in the DB, never from the client.
Socket.IO: `project:join` (membership checked) joins room `project:<id>`; events `task:created|updated|deleted`, `comment:created`. Each user auto-joins `user:<id>` for `notification:new`. Socket auth = same JWT in `handshake.auth.token`.

## Data model
User, Organization, Membership (org+user+role, unique), Project, Task, Comment, AuditLog, Notification.

## Permissions
| Role | Adds |
|---|---|
| VIEWER | view projects/tasks/comments |
| MEMBER | create tasks, edit tasks assigned to them, comment |
| ADMIN | manage projects + members (MEMBER/VIEWER only), edit/reassign/delete any task, view audit log |
| OWNER | everything, can grant ADMIN/OWNER |
Non-members get 404 on org resources (no id probing); members without permission get 403.

## API (all under /api, Bearer token except auth)
| | |
|---|---|
| POST /auth/register, /auth/login, GET /auth/me | |
| POST/GET /organizations | create (caller = OWNER) / list mine |
| GET/POST /organizations/:id/members, DELETE .../:userId | |
| POST/GET /projects (?organizationId), GET/PUT/DELETE /projects/:id | GET /:id includes task counts per status |
| POST /tasks, GET /tasks, GET/PUT/DELETE /tasks/:id | GET /:id includes activity history |
| POST/GET /tasks/:id/comments | `mentions: [userId]` triggers notifications |
| GET /audit-logs | organizationId (required), entity, entityId, action, user, from, to, q, page, limit |
| GET /notifications (?unread=true), PATCH /notifications/:id/read, PATCH /notifications/read-all | |

Task search params: `organizationId` or `projectId`, `status`, `priority`, `labels` (comma lists), `assignee` (id | me | none), `dueBefore`, `dueAfter`, `createdBefore`, `createdAfter`, `q` (text), `sortBy` (createdAt|dueDate|position), `order`, `page`, `limit` (max 100).
Kanban: load each column with `?projectId=X&status=TODO&sortBy=position&order=asc`; drag = `PUT /tasks/:id {status, position}`.
Errors: `{ error: { code, message, details? } }`.

## Indexing (100k tasks / 1k orgs)
Every query is scoped by `organization`, so it is the prefix of every index.
- Task: `{org, project, status, position}` board columns; `{org, assignee, status}` my tasks; `{org, dueDate}`; `{org, createdAt:-1}`; `{org, labels}` multikey; `{org, title/description text}`; `{dueDate}` deadline job.
- AuditLog: `{org, timestamp:-1}`, `{org, entity, entityId, timestamp}`, `{org, action, timestamp}`, `{org, user, timestamp}`, `{org, summary text}`.
- Membership: unique `{org, user}`, `{user}`. Notification: `{user, read, createdAt:-1}`, unique sparse `dedupeKey`. Comment: `{task, createdAt}`.
- No N+1: lists use one query + one batched populate; list view omits description/attachments; all lists paginated.

## Notifications
Assigned, status changed (assignee + creator), mentioned, added to org, deadline within `DEADLINE_WINDOW_HOURS` (interval job, deduped by `dedupeKey` so each task/due date notifies once). The actor never notifies themself.

## Known limitations
- Kanban ordering is last-write-wins (`position` float); no optimistic locking.
- Removed members stay in socket rooms until they disconnect.
- Org + membership creation is not in a transaction.
- Attachments are metadata (name/url) only; no file upload.
- Auth is a temporary JWT register/login; `middleware/auth.js` is the only place to swap in Clerk.
- Deadline job runs in-process (single instance); use a queue/cron for multiple instances.
- Integration test was not run in the build sandbox (no MongoDB available).

## With 2 more days
Redis adapter for Socket.IO, BullMQ for the deadline job, file uploads, rate limiting + helmet, refresh tokens, Mongo transactions, load-test the search endpoint.
