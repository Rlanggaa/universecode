# Security Specification — Aetherium Codex Firestore Rules

## 1. Data Invariants
1. **Default-Deny Catch-All**: All paths not explicitly matched are unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Invariant**: Every write operation (`create`, `update`, `delete`) across `/users/{userId}`, `/workspaces/{workspaceId}`, `/worlds/{worldId}`, and `/articles/{articleId}` requires `request.auth != null && request.auth.token.email_verified == true`.
3. **Cross-Domain Cryptographic Account Vault Invariant (`/cloud_accounts/{accountId}` & `/cloud_backups/{chunkId}`)**:
   - Stores zero raw PII (uses SHA-256 `accountId` and `passwordToken`).
   - Forbids all `list` and `delete` operations (`allow list, delete: if false;`).
   - Enforces immutable `accountId`, `passwordToken`, and `createdAt` on `update` (`incoming().passwordToken == existing().passwordToken`), preventing unauthorized overwrites if an attacker does not possess the account's cryptographic `passwordToken`.
   - Enforces parent existence and matching `passwordToken` on `/cloud_backups/{chunkId}` via `exists()` and `get()`.
4. **Strict Path & ID Validation**: Every single-document operation (`get`, `create`, `update`, `delete`) validates the path parameter via `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
5. **Relational Parent Existence (Global Consistency Invariant)**:
   - Creating a `WorldEntity` in `/worlds/{worldId}` requires `exists(/databases/$(database)/documents/workspaces/$(incoming().workspaceId))` and verifies that the parent workspace's `ownerId == request.auth.uid`.
   - Creating an `ArticleEntity` in `/articles/{articleId}` requires `exists(/databases/$(database)/documents/worlds/$(incoming().worldId))` and verifies that the parent world's `ownerId == request.auth.uid`.
   - Creating or updating a `CloudBackupChunk` in `/cloud_backups/{chunkId}` requires `exists(/databases/$(database)/documents/cloud_accounts/$(incoming().accountId))` and verifies that the parent account's `passwordToken == incoming().passwordToken`.
6. **PII Isolation & Query Enforcer**:
   - `/users/{userId}` and `/cloud_accounts/{accountId}` store zero raw email/phone/address fields.
   - Every `allow list` rule enforces `resource.data.ownerId == request.auth.uid` (or `resource.data.visibility == 'public'`), and `/cloud_accounts` & `/cloud_backups` disallow `list` completely.
7. **Temporal & Ownership Immutability**:
   - On `create`: `incoming().createdAt == request.time && incoming().updatedAt == request.time`.
   - On `update`: `incoming().createdAt == existing().createdAt && incoming().updatedAt == request.time`.
8. **Terminal State Locking**:
   - In `/articles/{articleId}`, once `existing().status == 'archived'`, no further updates are permitted unless performed by an admin (`isAdmin()`).

## 2. The "Dirty Dozen" Payloads
1. **Unverified Email Write**: Authenticated user with `email_verified: false` attempting to create `/workspaces/ws-1`. -> `PERMISSION_DENIED`
2. **Identity Spoofing on Create**: User `uid-A` creating `/worlds/w-1` with `ownerId: "uid-B"`. -> `PERMISSION_DENIED`
3. **Shadow Field Injection on Create**: Creating `/articles/art-1` with an undeclared field `"isFeatured": true`. -> `PERMISSION_DENIED`
4. **Shadow Field Injection on Update**: Updating `/articles/art-1` with `"hacked": 1` outside `affectedKeys().hasOnly(...)`. -> `PERMISSION_DENIED`
5. **Orphaned World Creation**: Creating `/worlds/w-orphan` pointing to non-existent `workspaceId: "ws-nonexistent"`. -> `PERMISSION_DENIED`
6. **Cross-Tenant Parent Attachment**: User `uid-A` creating `/articles/art-hijack` pointing to `worldId` owned by `uid-B`. -> `PERMISSION_DENIED`
7. **ID Poisoning Attack**: Creating `/workspaces/invalid$id!with*spaces` or ID > 128 chars. -> `PERMISSION_DENIED`
8. **Value Poisoning on Update**: Updating `title` on `/articles/art-1` with a boolean `true` or string > 200 chars. -> `PERMISSION_DENIED`
9. **Immortal Field Mutation**: Updating `createdAt` or `ownerId` on `/workspaces/ws-1` or mutating `passwordToken` on `/cloud_accounts/acct-1`. -> `PERMISSION_DENIED`
10. **Forged Client Timestamp**: Creating or updating `/worlds/w-1` with a past or future `updatedAt != request.time`. -> `PERMISSION_DENIED`
11. **Terminal State Mutation**: Updating an article whose `existing().status == 'archived'`. -> `PERMISSION_DENIED`
12. **Blanket List Scraping**: Listing `/workspaces` without filtering `resource.data.ownerId == request.auth.uid` or attempting to list `/cloud_accounts`. -> `PERMISSION_DENIED`
