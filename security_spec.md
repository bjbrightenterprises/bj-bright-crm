# Firestore Security Specification — BJ Bright Enterprises CRM

1. **Active User Gate (`isActiveUser()`)**:
   - Every read and write across the database requires `request.auth != null` and `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.active == true`.
   - Exception: The initial Admin (`praveenverma1420@gmail.com` or `admin@bjbright.com`) can bootstrap their own `users/{uid}` document on first sign-in, and any authenticated user can read their own `users/{uid}` document to verify active status.

2. **Role-Based Read & Write Access**:
   - `users/{uid}`: Active users can read; only Admin can create, update, or delete (plus initial Admin self-bootstrap).
   - `candidates/{id}`: Admin and Manager can read all; Recruiter and HR Executive can read only records where `resource.data.assignedRecruiterId == request.auth.uid`. Updates require a non-empty `lastEditReason` string. Only Admin can delete.
   - `clients/{id}` (Companies): All active users can read all companies. Only Admin, Manager, and HR Executive can create or update. Updates require a non-empty `lastEditReason` string. Only Admin can delete.
   - `jobs/{id}`: All active users can read. Active users can create/update; updates require a non-empty `lastEditReason` string. Only Admin can delete.
   - `pipeline/{id}`: Admin and Manager read all; Recruiter and HR Executive read only `resource.data.assignedRecruiterId == request.auth.uid`. Only Admin can delete.
   - `interviews/{id}`: Admin and Manager read all; Recruiter and HR Executive read only `resource.data.assignedToRecruiterId == request.auth.uid`. Only Admin can delete.
   - `tasks/{id}`: Admin and Manager read all; Recruiter reads `resource.data.assignedToUserId == request.auth.uid`; HR Executive reads tasks assigned to them or created by them. Task creation is permitted ONLY by Admin or HR Executive (and HR Executive can only create tasks for users whose role is `recruiter`). Only Admin can delete.
   - `editHistory/{id}` & `remarks/{id}`: Create-only (`allow update, delete: if false;`) for active users.
   - `trash/{id}`: Admin-only read, create, update, and delete.
   - `settings/{docId}`: Active users can read; Admin can write.
