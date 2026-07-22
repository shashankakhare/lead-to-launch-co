## Super Admin Edit Features

Add editing capabilities to the admin panel for four areas.

### 1. Landing page content
- New `site_content` table (key/value JSON) storing hero, process, pricing blurbs, FAQ, footer text.
- Public loader on `/` reads it (falls back to current hardcoded defaults if empty).
- Admin route `/admin/content` with grouped forms (Hero, Process, Pricing copy, FAQ list editor, Footer).

### 2. Packages & pricing
- New `packages` table (slug, name, price_usd, pages, features[], cta, sort, active) + `addons` table (key, name, price_usd, description, active).
- Seed from current `src/lib/packages.ts` defaults.
- Landing + checkout read from DB; keep `packages.ts` as type/fallback.
- Admin route `/admin/packages` — list + inline edit prices, features, toggle active, reorder.

### 3. Orders
- Admin route `/admin/orders/$id` already exists (status/timeline). Extend with an "Edit" panel:
  - Editable: amount_usd, package_tier, status (dropdown of all statuses), notes, assigned_to (if developer roles added later — for now just a text field), delete order.
- Server fn `adminUpdateOrder` (RBAC guarded) using `supabaseAdmin`.

### 4. Users & roles
- Admin route `/admin/users`:
  - List all profiles + their roles.
  - Edit full_name, email (display), promote/demote: toggle `admin`, `client`, `developer` role.
  - Delete user (auth admin API).
- Server fns: `adminListUsers`, `adminSetUserRoles`, `adminDeleteUser` — all guarded by `has_role(admin)`.

### Shared
- All admin mutations go through `createServerFn` with `requireSupabaseAuth` + admin check before importing `supabaseAdmin`.
- Add nav entries in admin sidebar: Content, Packages, Orders, Users.
- Zod validation on every input.

### Technical notes
- Migrations: create `site_content`, `packages`, `addons` tables with GRANTs (anon SELECT for site_content + packages + addons since landing is public; admin-only writes via RLS using `has_role`).
- New app_role value `developer` added to enum for future use.
- Files:
  - `src/lib/admin-content.functions.ts`
  - `src/lib/admin-packages.functions.ts`
  - `src/lib/admin-users.functions.ts`
  - extend `src/lib/admin.functions.ts` for order edit
  - `src/routes/_authenticated/admin.content.tsx`
  - `src/routes/_authenticated/admin.packages.tsx`
  - `src/routes/_authenticated/admin.users.tsx`
  - update `src/routes/index.tsx` and checkout to read DB packages with fallback.

Scope is large — confirm and I'll build it in this order: DB migrations → server fns → admin UIs → wire landing/checkout to DB.
