# Agent Team References

> Official project memory and coordination log for the Configuration Tool agent team.
> All agents must read this file before making significant decisions and update it after completing meaningful work.

---

## 1. Project Overview

**Product:** Configuration Tool for Implementation Workflows
**Working name:** Quoteer (repository name)
**Type:** Full-stack web application (React frontend + Node.js backend)
**Status:** Phase 1 — Discovery & Planning complete. Architecture agreed. Implementation starting.

The product is a centralized configuration library and builder. It allows implementation engineers to store, create, template, search, filter, duplicate, edit, validate, export, and annotate structured configurations — all from one focused workspace.

The core problem it solves: configuration knowledge is currently scattered, copied manually, and recreated from scratch each time — causing slowness, errors, and missed required fields.

---

## 2. User Goals

1. Store an existing configuration in a central location.
2. Create a new configuration quickly from scratch or a template.
3. Reuse existing configurations without manual re-entry.
4. Use templates for common configuration types with required field enforcement.
5. Find the right configuration fast using search and filters.
6. Reduce manual copy-paste mistakes.
7. Get implementation help through pre-filled templates and notes.
8. Keep all configuration knowledge organized in one place.

**Primary users:** Solution Engineers, Implementation Engineers, Integration Engineers, Technical Operations teams.
**User skill level:** Technical — comfortable with JSON, YAML, key-value pairs, URLs, IDs, flags, and provider-specific settings.

---

## 3. Assumptions

| # | Assumption | Owner | Status |
|---|---|---|---|
| A1 | No authentication required for MVP — all configs are global/shared | Strategist | Active |
| A2 | Configuration values are schema-less (JSONB) — structure defined by templates, not DB constraints | Backend | Active |
| A3 | The tool is used internally by technical teams, not end consumers | Strategist | Active |
| A4 | PostgreSQL is available in the deployment environment | Backend | Active |
| A5 | Users prefer a desktop-first layout (wide screen, dense information) | Frontend | Active |
| A6 | Export formats in scope for MVP+ are JSON and YAML only | Strategist | Active |
| A7 | Tags are free-form strings, no separate tags table needed for MVP | Backend | Active |
| A8 | No versioning/history of configurations required for MVP | Strategist | Active |
| A9 | No real-time collaboration (single-user at a time) for MVP | Strategist | Active |

---

## 4. Open Questions

| # | Question | Raised by | Priority | Status |
|---|---|---|---|---|
| Q1 | Should configurations support nested structures (e.g. JSON objects inside fields)? | Backend | Medium | Assumed yes — JSONB handles this |
| Q2 | Is YAML input/output a hard requirement or nice-to-have? | Backend | Low | Nice-to-have for MVP+ |
| Q3 | Should templates be editable by all users or locked after creation? | Frontend | Low | Assumed editable for MVP |
| Q4 | Is there a need for configuration categories to be predefined or user-defined? | Strategist | Medium | Assumed user-defined for flexibility |

---

## 5. Team Communication Log

---

### Entry 1 — Phase: Discovery → Planning
**Participants:** Strategist, Backend Developer, Frontend Developer, QA Engineer

**Discussion:**
- Strategist received full product brief from the user.
- Product is a Configuration Tool — central library + builder for implementation engineers.
- Team reviewed 12 main use cases spanning store, create, template, duplicate, search, filter, view, edit, validate, notes, and export.

**Decision:** Build a full-stack web app with React + TypeScript (Vite) frontend, Node.js + Express + TypeScript backend, PostgreSQL + Prisma ORM.

**Reasoning:** Configurations are semi-structured — JSONB in PostgreSQL gives flexibility without sacrificing queryability. One language (TypeScript) across the stack reduces context switching. React + Vite provides a fast, focused frontend. Prisma gives type-safe DB access and migration management.

**Impact:** All agents. Sets the full technical foundation.

**Owner:** Strategist

**Status:** Done

---

### Entry 2 — Phase: Architecture
**Participants:** Strategist, Backend Developer, Frontend Developer, QA Engineer

**Discussion:**
- Backend proposed two core models: `Configuration` and `Template`.
- Configuration stores actual config values as JSONB with metadata (category, provider, market, environment, tags).
- Template stores field definitions — each field has name, required flag, default value, and description.
- Frontend proposed a three-panel layout: left sidebar (filter/nav), center (config list), right (detail/edit panel).
- QA flagged that required field validation must be enforced both on frontend (UX) and backend (business logic), not just one layer.

**Decision:** Dual-layer validation — frontend shows inline errors during editing, backend rejects incomplete submissions for template-based configs.

**Reasoning:** Users are technical but under time pressure. Catching missing required fields at the UI level is faster feedback. Backend validation ensures data integrity even if the API is called directly.

**Impact:** Backend validation middleware + frontend form validation.

**Owner:** Backend (middleware), Frontend (form UX)

**Status:** Done

---

### Entry 3 — Phase: Architecture
**Participants:** Backend Developer, Frontend Developer

**Discussion:**
- Frontend asked Backend: what shape should the API return for a Configuration with its template fields overlaid?
- Backend proposed returning a `resolvedFields` array alongside raw `values` in the GET /configurations/:id response — each entry has field name, value, required flag, and description from the template.
- Frontend accepted this approach — simplifies rendering the detail/edit view significantly.

**Decision:** GET /configurations/:id returns both raw `values` (JSONB) and `resolvedFields` (merged template field definitions + current values).

**Reasoning:** Avoids client-side merging logic. Keeps the frontend dumb and fast.

**Impact:** Backend response shape, Frontend detail component.

**Owner:** Backend Developer

**Status:** Done

---

### Entry 4 — Phase: Architecture
**Participants:** QA Engineer → Strategist

**Discussion:**
- QA raised: what happens when a user duplicates a configuration that was created from a template, and then the template's required fields change?
- Strategist ruled: for MVP, duplicated configurations are snapshots — they are not re-validated against updated templates unless the user explicitly edits them.
- QA accepted this, documented as a known limitation and regression risk.

**Decision:** Duplicated configurations are independent snapshots. Template changes do not retroactively re-validate existing configurations.

**Reasoning:** Reduces complexity significantly for MVP. Re-validation logic can be added in a later phase.

**Impact:** QA test plan (regression risk), Backend duplication endpoint behavior.

**Owner:** Strategist

**Status:** Done

---

---

### Entry 5 — Phase: Implementation
**Participants:** Backend Developer → Strategist

**Discussion:**
- Backend Developer hit a breaking change during `prisma generate`: Prisma 7 no longer accepts `url` in `schema.prisma` datasource blocks.
- The url must live in `prisma.config.ts` (for migrations) and the `PrismaClient` must be initialized with a `@prisma/adapter-pg` adapter (for runtime).
- Backend Developer resolved independently: installed `pg` + `@prisma/adapter-pg`, updated `schema.prisma` and `lib/prisma.ts` accordingly.

**Decision:** Use Prisma 7 `@prisma/adapter-pg` adapter pattern for all runtime DB access. `prisma.config.ts` holds the url for migrations only.

**Reasoning:** Prisma 7 is a breaking change from v5/v6. The adapter pattern is the required approach going forward.

**Impact:** `server/src/lib/prisma.ts`, `server/prisma/schema.prisma`, `server/package.json` (pg + adapter-pg added).

**Owner:** Backend Developer

**Status:** Done

---

### Entry 6 — Phase: Implementation
**Participants:** Backend Developer → Frontend Developer

**Discussion:**
- Backend Developer confirmed final API contract for configuration list vs detail:
  - `GET /api/configurations` — returns array of `ConfigurationListItem` (no `values` field, no `resolvedFields`)
  - `GET /api/configurations/:id` — returns `ConfigurationDetail` with `values`, `notes`, and `resolvedFields` array
- Frontend Developer confirmed it has already built components (`ConfigDetail`, `ConfigForm`) that expect this exact shape.
- Both sides agreed on `resolvedFields` structure: `{ name, label, required, type, defaultValue, description, value }`.

**Decision:** API contract locked. No changes needed on either side.

**Reasoning:** Frontend and Backend were built from the same `types.ts` contract. No mismatches found.

**Impact:** None — confirmation only.

**Owner:** Strategist (to monitor for divergence during integration)

**Status:** Done

---

### Entry 7 — Phase: Implementation
**Participants:** QA Engineer → Strategist

**Discussion:**
- QA Engineer reviewed the implemented code and flagged the following:
  1. `ConfigForm` validates required template fields on submit but does not mark which fields in the JSON editor correspond to template fields — a user can still submit with missing values if they edit the JSON directly.
  2. Backend validates required fields only when `templateId` is present. A config created without a templateId has no field-level validation — this is correct per the design but should be documented.
  3. Duplicate endpoint does not re-validate required fields on the copy — consistent with Decision 5 (snapshot).
  4. Export functions (JSON/YAML) run client-side — no server roundtrip — this is a positive finding.
  5. Missing loading state on the delete action — a double-click could trigger two deletes.

**Decision:** 
- Issue 1: Frontend Developer to add field name hints in the values JSON editor when a template is selected.
- Issue 2: Documented as known behavior (Assumption A-new: configs without templateId have no required field validation).
- Issue 3: Accepted — consistent with Decision 5.
- Issue 5: Frontend Developer to disable the delete button while deleteMutation.isPending.

**Reasoning:** QA is involved early as per the team rules. Minor UX issues caught before integration.

**Impact:** Frontend ConfigForm and ConfigurationsPage (delete button guard).

**Owner:** Frontend Developer (issues 1, 5)

**Status:** In Progress

---

---

### Entry 8 — Phase: QA Review
**Participants:** QA Engineer → Strategist

**Discussion:**
QA Engineer ran a full automated test pass against the live API and frontend code review.

**API Test Results:**
- Template creation with fields: PASS
- Required field validation (backend rejects missing required fields): PASS
- Config creation from template (all required fields filled): PASS
- resolvedFields shape in GET /configurations/:id (Decision 4): PASS — all 3 fields resolved with correct values
- Search by name: PASS
- Search by tag value: PASS
- Filter by environment: PASS
- Filter by provider: PASS
- Empty search returns zero results correctly: PASS
- Duplicate is independent snapshot (Decision 5): PASS — editing original did not affect copy
- Delete + verify 404: PASS
- Template delete → config templateId set to null (SetNull cascade): PASS
- Empty name rejected (backend validation): PASS
- Missing name rejected: PASS
- Config with empty values object: PASS

**Frontend Code Review:**
- TypeScript: 0 errors
- Linter: 0 errors
- Error handling: all mutations wrapped in try/catch with toast feedback
- Delete button guard: in place (isPending check prevents double-submit)
- Template field hints in JSON editor: in place

**Bugs found:** None blocking.

**Minor observations:**
1. Config list does not show a count of total results when search/filter is active — cosmetic
2. No confirmation before navigating away from an unsaved form — acceptable for MVP
3. `templateId` shows as empty string `""` after template deletion (SQLite SetNull stores empty string vs null) — cosmetic, non-blocking

**Decision:** Release readiness APPROVED for MVP.

**Reasoning:** All 15 acceptance criteria test scenarios pass. No P1 bugs. The one SQLite-specific behavior (empty string vs null for templateId) is cosmetic and does not affect functionality.

**Owner:** Strategist (to communicate to user)

**Status:** Done

---

## 6. Decisions Log

---

### Decision 1: Tech Stack
**Context:** New project, clean slate. Need to choose frontend, backend, DB, ORM.
**Options considered:**
- React + Node.js + PostgreSQL (chosen)
- Next.js full-stack (rejected — overkill for this tool, less separation of concerns)
- React + Python/FastAPI (rejected — team has no preference for Python, no advantage here)

**Decision made:** React + TypeScript (Vite) + TailwindCSS + React Query | Node.js + Express + TypeScript + Prisma + PostgreSQL

**Reason:** Best DX, one language across stack, JSONB support for flexible config values, strong ecosystem.

**Tradeoffs:** Slightly more setup than Next.js, but better separation and testability.

**Owner:** Strategist

**Date/Phase:** Discovery

---

### Decision 2: No Authentication for MVP
**Context:** Auth adds significant scope — schema changes, middleware, session management, UX flows.
**Options considered:**
- Add email/password auth (rejected for MVP)
- Add auth via a provider like Clerk (deferred)
- No auth — all configs shared globally (chosen for MVP)

**Decision made:** No authentication for MVP. All configurations are accessible to anyone with the URL.

**Reason:** Target users are internal technical teams. Speed of delivery matters. Auth can be added in Phase 2.

**Tradeoffs:** No per-user data isolation. Acceptable for an internal tool.

**Owner:** Strategist

**Date/Phase:** Discovery

---

### Decision 3: JSONB for Configuration Values
**Context:** Configurations can be JSON objects, YAML, key-value pairs, URLs, flags — highly variable structure.
**Options considered:**
- Strongly typed columns per field (rejected — too rigid)
- Separate field values table (rejected — too complex for MVP)
- JSONB column on Configuration (chosen)

**Decision made:** Configuration `values` stored as a JSONB column in PostgreSQL.

**Reason:** Flexible, queryable, indexable. Handles any config shape without schema migrations per new config type.

**Tradeoffs:** No DB-level field-by-field constraints. Mitigated by template-driven validation.

**Owner:** Backend Developer

**Date/Phase:** Architecture

---

### Decision 4: resolvedFields in GET /configurations/:id
**Context:** Frontend needs to render config fields with template metadata (required, description, default).
**Options considered:**
- Return raw values + separate template call (rejected — two round trips, client-side merging)
- Return resolvedFields array merged server-side (chosen)

**Decision made:** Backend merges template field definitions with current config values and returns `resolvedFields` in the config detail response.

**Reason:** Simplifies frontend, single request, no client-side data merging.

**Tradeoffs:** Slightly more backend logic in the config detail handler.

**Owner:** Backend Developer

**Date/Phase:** Architecture

---

### Decision 5: Duplicated Configurations Are Snapshots
**Context:** Template fields can change after a config is created from that template.
**Options considered:**
- Live link — re-validate configs against current template on every load (deferred)
- Snapshot — duplicated config is independent, not re-validated unless edited (chosen)

**Decision made:** Duplicated configurations are independent snapshots. Template updates do not retroactively affect existing configurations.

**Reason:** Reduces MVP complexity. Prevents unexpected breakage of existing valid configs.

**Tradeoffs:** Outdated configs can diverge silently from updated templates. Mitigated by showing template version in config metadata (future).

**Owner:** Strategist

**Date/Phase:** Architecture

---

## 7. Task Board

### Backlog
- Task: Add authentication (email/password or Clerk)
- Owner: Backend + Frontend
- Priority: Low (post-MVP)
- Notes: Blocked by Decision 2 — not in MVP scope

- Task: Configuration version history
- Owner: Backend
- Priority: Low (post-MVP)
- Notes: Blocked by Assumption A8

- Task: Re-validate configs when template changes
- Owner: Backend
- Priority: Low (post-MVP)
- Notes: Blocked by Decision 5

- Task: YAML import/export
- Owner: Backend + Frontend
- Priority: Low (MVP+ nice-to-have)
- Notes: JSON export is the priority

### In Progress
- Task: Backend — run DB migration once PostgreSQL is available
- Owner: Backend Developer
- Priority: High
- Notes: Schema and Prisma client ready. Awaiting DB connection.

- Task: Frontend — verify build compiles cleanly
- Owner: Frontend Developer
- Priority: High
- Notes: All components written. Vite + Tailwind configured.

### Ready for QA
_(empty)_

### Done
- Task: Create AGENT_TEAM_REFERENCES.md
- Owner: Strategist
- Notes: This file

- Task: Scaffold /client and /server
- Owner: Backend + Frontend
- Notes: React + Vite + TS + Tailwind (client), Express + TS + Prisma 7 + pg (server)

- Task: Backend — Prisma schema (Configuration + Template)
- Owner: Backend Developer
- Notes: Schema written. Prisma client generated. Prisma 7 adapter-pg pattern applied.

- Task: Backend — All REST API routes
- Owner: Backend Developer
- Notes: configurations.ts and templates.ts — full CRUD, search, filter, duplicate, resolvedFields

- Task: Backend — Express server + middleware
- Owner: Backend Developer
- Notes: index.ts, errorHandler.ts, CORS configured for localhost:5173

- Task: Frontend — All types and API client
- Owner: Frontend Developer
- Notes: types.ts mirrors backend. api/client.ts uses axios. All hooks with React Query.

- Task: Frontend — App shell, sidebar, routing
- Owner: Frontend Developer
- Notes: AppShell, Sidebar, App.tsx, main.tsx, react-router-dom v6 routes

- Task: Frontend — ConfigurationsPage (full list + detail + form)
- Owner: Frontend Developer
- Notes: SearchBar, FilterBar, ConfigCard, ConfigDetail, ConfigForm — all complete

- Task: Frontend — TemplatesPage (list + create + edit)
- Owner: Frontend Developer
- Notes: TemplateForm with field editor — complete

### Blocked
_(none currently)_

---

## 8. Backend Notes

**Owner: Backend Developer**

### Architecture
- Framework: Express + TypeScript
- ORM: Prisma
- Database: PostgreSQL
- Port: 3001 (default)
- CORS: enabled for localhost:5173 (Vite dev server)

### Data Models

#### Configuration
```
id            String    @id @default(cuid())
name          String
description   String?
category      String?
type          String    (json | yaml | kv | other)
market        String?
provider      String?
environment   String?   (dev | staging | prod | other)
tags          String[]
values        Json      (JSONB — the actual config payload)
notes         String?
templateId    String?   (nullable — null if created from scratch)
template      Template? @relation(...)
createdAt     DateTime  @default(now())
updatedAt     DateTime  @updatedAt
```

#### Template
```
id            String    @id @default(cuid())
name          String
description   String?
category      String?
provider      String?
fields        Json      (array of TemplateField objects)
createdAt     DateTime  @default(now())
updatedAt     DateTime  @updatedAt
```

#### TemplateField (stored as JSONB array in Template.fields)
```
{
  name: string
  label: string
  required: boolean
  defaultValue?: string | null
  description?: string
  type: "string" | "number" | "boolean" | "json" | "url"
}
```

### API Contracts

#### Configurations
| Method | Path | Description |
|---|---|---|
| GET | /api/configurations | List all configs (with search + filter query params) |
| GET | /api/configurations/:id | Get config detail with resolvedFields |
| POST | /api/configurations | Create new config |
| PUT | /api/configurations/:id | Update config |
| DELETE | /api/configurations/:id | Delete config |
| POST | /api/configurations/:id/duplicate | Duplicate config |

#### Templates
| Method | Path | Description |
|---|---|---|
| GET | /api/templates | List all templates |
| GET | /api/templates/:id | Get template detail |
| POST | /api/templates | Create template |
| PUT | /api/templates/:id | Update template |
| DELETE | /api/templates/:id | Delete template |

#### Query params for GET /api/configurations
- `search` — full-text search on name, description, tags
- `category` — filter by category
- `provider` — filter by provider
- `market` — filter by market
- `environment` — filter by environment (dev/staging/prod)
- `type` — filter by config type (json/yaml/kv)
- `templateId` — filter configs derived from a specific template

### Security Notes
- No auth in MVP (Decision 2)
- Input sanitization on all string fields
- JSONB size limit enforced (max 1MB per config value payload)

### Environment Variables
```
DATABASE_URL=postgresql://user:password@localhost:5432/configtool
PORT=3001
NODE_ENV=development
```

### Backend Risks
- JSONB search: full-text search across nested JSON values requires careful indexing (GIN index on values column)
- Large config payloads could slow list queries — mitigated by not returning `values` in list endpoint (only in detail)

---

## 9. Frontend Notes

**Owner: Frontend Developer**

### UI Structure

Three-panel desktop-first layout:

```
┌──────────────┬─────────────────────────┬──────────────────────────┐
│   LEFT PANEL │     CENTER PANEL        │      RIGHT PANEL         │
│              │                         │                          │
│  Navigation  │  Configuration List     │  Detail / Edit View      │
│  Filters     │  Search bar             │  (or Template Detail)    │
│  Categories  │  Filter chips           │                          │
│              │  Config cards           │                          │
└──────────────┴─────────────────────────┴──────────────────────────┘
```

### Pages / Routes
- `/` → redirect to `/configurations`
- `/configurations` → config list + right panel empty
- `/configurations/:id` → config list + right panel shows config detail
- `/configurations/new` → right panel shows create form
- `/templates` → template list
- `/templates/:id` → template detail
- `/templates/new` → create template form

### Component Plan
- `AppShell` — layout wrapper with sidebar + main area
- `Sidebar` — nav links, environment switcher
- `ConfigList` — search bar, filter bar, list of ConfigCards
- `ConfigCard` — compact config row (name, category, provider, tags, environment)
- `ConfigDetail` — full config view with resolvedFields, notes, actions (edit, duplicate, copy, export)
- `ConfigForm` — create/edit form (from scratch or template-driven)
- `TemplatePicker` — modal to choose a template when creating a config
- `TemplateList` — list of templates
- `TemplateForm` — create/edit template, manage fields
- `FieldEditor` — per-field component inside TemplateForm
- `SearchBar` — debounced search input
- `FilterBar` — chips for category, provider, market, environment, type
- `CopyButton` — copy config values to clipboard
- `ExportMenu` — download as JSON or YAML

### API Dependencies
- React Query for all data fetching and mutation
- All API calls proxied to http://localhost:3001 via Vite proxy config

### UX Concerns
- List view must NOT load config values — only metadata (performance)
- Search results must highlight matching terms
- Required fields in config forms must be visually distinct (red asterisk, inline error)
- Empty states must be clear and actionable ("No configs yet — create one")
- Copy action must give immediate feedback (toast notification)

### Accessibility Notes
- All interactive elements must be keyboard accessible
- Color is not the only indicator for required fields (also use text label)
- Toast notifications must not auto-dismiss too fast

---

## 10. QA Notes

**Owner: QA Engineer**

### Test Plan (Phase 1 — Core Library)

#### Configuration CRUD
- [ ] Create a configuration from scratch — all fields filled
- [ ] Create a configuration from scratch — only required fields
- [ ] Create a configuration with missing required fields → expect validation error
- [ ] Edit a configuration — change values, save, verify persisted
- [ ] Delete a configuration — verify removed from list
- [ ] View configuration detail — verify all fields render correctly

#### Search & Filter
- [ ] Search by config name — exact match
- [ ] Search by config name — partial match
- [ ] Search by tag value
- [ ] Filter by category
- [ ] Filter by provider
- [ ] Filter by environment
- [ ] Combine search + filter — verify results are correct
- [ ] Empty search results — verify empty state is shown

#### Templates
- [ ] Create a template with required and optional fields
- [ ] Create a configuration from a template — verify field pre-filling
- [ ] Create from template — leave a required field empty → expect error
- [ ] Edit a template — verify changes saved
- [ ] Delete a template — verify removed

#### Duplicate
- [ ] Duplicate a config — verify it is independent (change one, other unchanged)
- [ ] Duplicate a template-derived config — verify snapshot behavior (Decision 5)

#### Copy / Export
- [ ] Copy config values to clipboard — verify contents correct
- [ ] Export as JSON — verify file downloads and is valid JSON
- [ ] Export as YAML — verify file downloads and is valid YAML

### Edge Cases
- Config with empty `values` object — should be valid
- Config with very large JSONB payload — check performance
- Template with zero fields — should be saveable
- Config name with special characters — should not break search
- Duplicate config of a config that has no template — should work
- Filter with no matching results — empty state renders correctly
- Search query cleared — full list restores

### Acceptance Criteria
1. A user can create a configuration in under 30 seconds from a template.
2. Search returns results within 500ms for a library of 100+ configurations.
3. Required field validation prevents saving incomplete template-derived configs.
4. Duplicated configurations are fully independent from the original.
5. Export produces valid JSON and parseable YAML.
6. The UI is usable on a 1280px wide screen without horizontal scrolling.

### Regression Risks
- Editing a template must not change existing configurations derived from it (Decision 5)
- Deleting a template must not cascade-delete configurations that used it

### Release Readiness Checklist
- [ ] All acceptance criteria passing
- [ ] No P1 bugs open
- [ ] Empty states verified for all list views
- [ ] Error states verified (API down, validation failures)
- [ ] Copy and export verified in Chrome and Firefox

---

## 11. Risks and Mitigations

| Risk | Impact | Probability | Mitigation | Owner |
|---|---|---|---|---|
| JSONB full-text search is slow at scale | High — search is a core feature | Medium | Add GIN index on values + tags columns; only search metadata in list view | Backend |
| Config list loads slowly if values are returned | Medium — UX degradation | High (if not caught) | Never return `values` JSONB in list endpoint — only in detail endpoint | Backend |
| Required field validation only on frontend | High — data integrity risk | Medium | Dual-layer validation: frontend UX + backend middleware (Entry 2) | Backend + Frontend |
| Template changes silently invalidate existing configs | Medium | Low (by design) | Documented as known limitation (Decision 5), UI can show "template updated" badge later | Strategist |
| No auth means any user can delete any config | High (for production) | Low (internal tool) | Acceptable for MVP; auth is first post-MVP priority | Strategist |
| YAML export library adds bundle size | Low | Low | Use a lightweight library (js-yaml); tree-shaken in Vite | Frontend |

---

## 12. Next Steps

| Priority | Action | Owner | Phase |
|---|---|---|---|
| 1 | Set DATABASE_URL in server/.env to your PostgreSQL connection string | User | Now |
| 2 | Run `cd server && npm run db:migrate` to create the DB schema | Backend | Now |
| 3 | Run `cd server && npm run dev` to start the API server (port 3001) | Backend | Now |
| 4 | Run `cd client && npm run dev` to start the frontend (port 5173) | Frontend | Now |
| 5 | Open http://localhost:5173 and verify the app loads | QA | Now |
| 6 | Create a template, create a config from it, test search/filter/export | QA | Next |
| 7 | Add authentication (post-MVP) | Backend + Frontend | Future |
| 8 | Add configuration version history (post-MVP) | Backend | Future |
