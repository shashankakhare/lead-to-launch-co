
# Advanced Admin Dashboard & Developer Management

Replace the basic tabbed admin with a proper operations console: KPI overview, multiple reports, and full developer CRUD with workload and performance.

## 1. Dashboard Overview (`/admin`)

Top-line KPIs and charts, all live from the database.

- **KPI tiles**: Total revenue (paid orders), orders this month, active projects, pending requirements, avg rating, avg delivery days.
- **Charts** (recharts):
  - Revenue trend — last 12 weeks (line)
  - Orders by status (donut)
  - Package mix — 1 / 5 / 10 page (bar)
  - New signups per week (bar)
- **Recent activity**: latest 10 orders + latest 10 project updates.
- **Alerts**: overdue projects (past ETA), unassigned paid orders, unread admin messages.

## 2. Reports (`/admin/reports`)

Sub-tabs, each with filters (date range, package, developer, status) and CSV export:

1. **Revenue report** — by day/week/month, by package, by currency.
2. **Orders report** — funnel: created → paid → in_progress → delivered; drop-off %.
3. **Developer performance** — per developer: assigned, delivered, avg delivery days, avg rating, hours logged, on-time %.
4. **Client satisfaction** — rating distribution, latest comments, NPS-style score.
5. **Time tracking** — hours per developer per week, per project breakdown.

## 3. Developer Management (`/admin/developers`)

Full CRUD with role `developer` in `user_roles`.

- **List**: name, email, active/inactive, current workload (open projects), hours this week, avg rating, joined date.
- **Create**: invite by email (creates auth user via admin API, sets profile fields, assigns `developer` role, sends reset-password email so they set their own password).
- **Edit**: full name, phone, avatar, skills, hourly capacity, active toggle.
- **Delete**: soft-disable (revoke role + mark inactive) with confirmation. Hard delete only if no orders assigned.
- **Detail page** (`/admin/developers/$id`):
  - Profile card
  - Assigned projects (with status, ETA, rating)
  - Time log (all entries, editable by admin)
  - Performance summary (mini charts)

## 4. Auto-assignment engine

- New table `dev_workload_view` (SQL view): open orders per active developer.
- Server function `autoAssignOrder(orderId)` picks the developer with lowest open count; ties broken by lowest hours-this-week.
- Trigger option on order paid: admin toggles auto-assign in settings; otherwise assign manually from order detail.

## 5. Time tracking

- Existing `time_entries` table (create if missing): developer_id, order_id, started_at, ended_at, minutes, note.
- Developer-side timer stays out of scope of this ticket (already planned); admin can view/edit/delete entries here.

## 6. Schema additions

Migration to add (only what doesn't exist):
- `profiles`: `phone`, `skills text[]`, `weekly_capacity_hours int`, `is_active bool default true`, `hourly_rate numeric`.
- `time_entries` table (if not present) with RLS: developer read/write own; admin all.
- View `admin_developer_stats` for performance queries.

## 7. Technical details

- All queries via `createServerFn` with `requireSupabaseAuth` + admin role check.
- Charts: `recharts` (already installed).
- Filters synced to URL search params via `validateSearch`.
- CSV export handled client-side from fetched rows.
- Reuse existing `admin.tsx` layout; convert tabs into a proper sidebar sub-nav (Overview, Reports, Orders, Developers, Users, Packages, Content).

## Deliverable order

1. Migration (schema + view)
2. Server functions (stats, reports, developer CRUD, auto-assign)
3. Admin layout refactor with sub-nav
4. Overview page
5. Reports page (all 5 sub-reports)
6. Developers list + detail + create/edit/delete

Approve to proceed, or tell me to drop/adjust sections.
