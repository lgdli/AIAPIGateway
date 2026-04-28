## Context

This API gateway currently requires manual user creation or OAuth auto-provisioning. Organizations with existing user databases need to:

1. Synchronize users from external MySQL/PostgreSQL databases
2. Keep user information (username, email, display_name, role, status) in sync
3. Have synced users authenticate via OAuth (password field remains empty)
4. Track sync operations for auditing

**Constraints:**
- Must not change existing OAuth flow
- Must reuse existing cron task framework
- Must support both MySQL and PostgreSQL
- Synced users identified by empty password field

## Goals / Non-Goals

**Goals:**
- Configure multiple external database sources
- Map external fields to local user fields with value transformation
- Schedule automatic sync via cron
- Provide Web UI for configuration and monitoring
- Track sync results (inserted/updated/disabled counts)
- Disable local users when removed from external source

**Non-Goals:**
- No changes to existing OAuth authentication flow
- No real-time sync (scheduled batch only)
- No password sync (OAuth users have empty password)
- No support for external DB user creation/modification
- No handling of external DB schema changes (admin must update config)

## Decisions

### D1: User Identification Strategy

**Decision:** Use `username` + empty `password` to identify synced users

**Alternatives:**
| Option | Pros | Cons |
|--------|------|------|
| username + empty password | No schema change, simple | Relies on convention |
| Add external_id field | Explicit tracking | Requires User model change |
| Use remark field | No model change | Occupies remark |

**Rationale:** Empty password is a clear marker for OAuth users. Matching by username from external unique_key is straightforward and requires no schema change.

### D2: Field Mapping Architecture

**Decision:** Store mappings in separate `external_user_field_mappings` table with transform_type and transform_config

**Structure:**
```
external_user_field_mappings
├─ source_id (FK to external_user_sources)
├─ external_field (string, e.g., "employee_id")
├─ local_field (string, e.g., "username")
├─ transform_type ("direct" or "value_map")
└─ transform_config (JSON, e.g., {"teacher": 1, "admin": 10})
```

**Alternatives:**
| Option | Pros | Cons |
|--------|------|------|
| Single JSON column | Flexible | Harder to query/validate |
| Separate table | Structured, queryable | More joins |
| Code-based mapping | Type-safe | Requires code changes for new mappings |

**Rationale:** Separate table allows UI to manage mappings easily. JSON config handles value mappings flexibly.

### D3: Sync Mode

**Decision:** Upsert mode (insert new, update existing)

**Sync Logic:**
1. Query external users
2. For each external user:
   - Find local user: `WHERE username = external.unique_key AND password = ''`
   - If found → Update fields per mappings
   - If not found → Insert new user with empty password
3. Find orphan users: `WHERE password = '' AND username NOT IN (external_usernames)`
4. Disable orphan users: `SET status = 2`

**Alternatives:**
| Option | Pros | Cons |
|--------|------|------|
| Insert only | Simple | No updates |
| Full replace | Clean slate | Destructive |
| Upsert | Best of both | More complex |

**Rationale:** Upsert handles both initial sync and ongoing updates without data loss.

### D4: Cron Integration

**Decision:** Reuse existing cron task framework with new executor

**Implementation:**
- Add `external_user_sync` to default cron tasks
- Executor iterates all enabled `ExternalUserSource` records
- Each source syncs independently with its own schedule

**Rationale:** Leverages existing infrastructure for scheduling, logging, manual trigger, and UI visibility.

### D5: Connection Security

**Decision:** AES encrypt database passwords in storage

**Implementation:**
- Passwords encrypted before storing in `external_user_sources.password`
- Decrypted at sync time
- Never returned to frontend

**Rationale:** Protects sensitive database credentials at rest.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| External DB unavailable during sync | Log error, skip source, continue with other sources |
| Username collision with non-OAuth user | Skip with warning log (password not empty = not our user) |
| Large external user count (10k+) | Batch processing with configurable page size |
| External user deleted then recreated | Gets disabled; next sync re-enables if found again |
| Value mapping missing for role/status | Use default values (role=1, status=1) |
| Connection string leakage in logs | Mask password in all log output |
