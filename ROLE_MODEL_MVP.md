# Alumni Smart Connect - MVP Role Model (Pre-Oral Ready)

## 1) Roles (MVP)

Use these roles first:

- SuperAdmin (system owner / IT)
- Principal
- Dean
- Teacher
- SchoolAdmin
- Alumni
- Student

If you want simpler scope for pre-oral, merge `Principal + Dean + Teacher` into one temporary role: `Staff`.

---

## 2) Account Creation Rules

### Public self-signup allowed
- Student
- Alumni

### No public self-signup
- Teacher
- Dean
- Principal
- SchoolAdmin

Staff accounts should be:
1. Invited by authorized admin, or
2. Created as `pending` and approved by authorized role.

---

## 3) Approval Status Lifecycle

Each user has `account_status`:

- pending
- approved
- rejected
- suspended

Rule:
- `pending` users cannot access protected dashboards.

---

## 4) Promotion / Assignment Rules (Safe Default)

- SuperAdmin can assign/revoke any role.
- Principal can assign/revoke: Teacher, Dean (optional SchoolAdmin if your policy allows).
- Dean can assign/revoke: Teacher only (optional).
- SchoolAdmin can manage Student/Alumni operational data only (no Principal assignment).
- No user can self-promote.

For pre-oral, this is enough:
- Only SuperAdmin can assign Principal.
- Principal can assign Dean/Teacher.

---

## 5) Permission Matrix (MVP)

| Action | Student | Alumni | Teacher | Dean | Principal | SchoolAdmin | SuperAdmin |
|---|---|---|---|---|---|---|---|
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View alumni directory | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Post discussion | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create announcement | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve announcement | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage events | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View department analytics | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| View school-wide analytics | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Approve staff account | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Assign Dean/Principal role | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Assign Teacher role | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |

Note: You can tighten or loosen these based on school policy.

---

## 6) Minimum Database Design (Backend)

## Table: `users`
- id (PK)
- first_name
- last_name
- email (unique)
- password_hash
- account_status (`pending|approved|rejected|suspended`)
- created_at
- updated_at

## Table: `roles`
- id (PK)
- code (unique) e.g. `STUDENT`, `ALUMNI`, `TEACHER`, `DEAN`, `PRINCIPAL`, `SCHOOL_ADMIN`, `SUPER_ADMIN`
- name

## Table: `user_roles`
- id (PK)
- user_id (FK -> users.id)
- role_id (FK -> roles.id)
- assigned_by (FK -> users.id)
- assigned_at
- active (boolean)

## Table: `permissions`
- id (PK)
- code (unique) e.g. `ANNOUNCEMENT_CREATE`, `ROLE_ASSIGN_TEACHER`
- name

## Table: `role_permissions`
- id (PK)
- role_id (FK -> roles.id)
- permission_id (FK -> permissions.id)

## Table: `audit_logs`
- id (PK)
- actor_user_id (FK -> users.id)
- action (e.g. `ROLE_ASSIGNED`, `ACCOUNT_APPROVED`)
- target_user_id (FK -> users.id, nullable)
- details (text/json)
- created_at

---

## 7) Backend Enforcement Rules (Important)

Always enforce on server/API, not only UI:

1. Authenticate user (session/JWT).
2. Load active roles + permissions.
3. Check permission before action.
4. Return 403 if unauthorized.
5. Write audit log for sensitive actions.

---

## 8) Pre-Oral Scope Recommendation (Fast + Solid)

Implement only these first:

- Users + Roles + UserRoles + AuditLogs
- Account status (`pending/approved`)
- 4 permission checks:
  - create announcement
  - approve announcement
  - assign teacher
  - assign dean

This gives you a defendable architecture in pre-oral without overcomplicating implementation.

---

## 9) Suggested Talking Point for Panel

"We separated authentication from authorization, implemented role-based access control, prevented self-promotion, and added auditable role assignment workflows so higher-privilege accounts are controlled and traceable."
