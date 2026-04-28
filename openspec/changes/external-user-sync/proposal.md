## Why

Organizations using this API gateway need to synchronize users from external databases (MySQL/PostgreSQL) instead of manually creating accounts. These users authenticate via OAuth and should have their basic information (username, email, display name, role, status) automatically kept in sync with the external source.

## What Changes

- Add external database source configuration (connection info, table name, query conditions)
- Add field mapping configuration (external fields to local fields, with value mapping support for role/status)
- Add scheduled sync task using existing cron framework
- Add Web UI for managing external data sources and field mappings
- Add sync log tracking (inserted/updated/disabled counts)
- Synced users are distinguished by empty password field (OAuth users)
- External users deleted from source will be disabled in this system

## Capabilities

### New Capabilities

- `external-user-source`: Configuration and management of external database connections for user synchronization
- `external-user-mapping`: Field mapping configuration between external database and local user table, with value mapping support

### Modified Capabilities

None - This is a new feature that does not modify existing spec requirements.

## Impact

**Backend:**
- New models: ExternalUserSource, ExternalUserFieldMapping, ExternalUserSyncLog
- New service: service/external_user_sync.go
- New executor: service/cron/executor_external_user_sync.go
- New controllers: controller/external_user_source.go
- New routes in router/api-router.go

**Frontend:**
- New page: pages/ExternalUserSource/index.jsx
- New components: SourceFormModal.jsx, FieldMappingModal.jsx, SyncLogModal.jsx

**Dependencies:**
- Reuses existing cron task framework
- Uses standard database/sql with MySQL/PostgreSQL drivers
- Compatible with existing OAuth flow (no changes)
