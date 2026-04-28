## 1. Data Models

- [ ] 1.1 Create ExternalUserSource model (model/external_user_source.go)
- [ ] 1.2 Create ExternalUserFieldMapping model (model/external_user_field_mapping.go)
- [ ] 1.3 Create ExternalUserSyncLog model (model/external_user_sync_log.go)
- [ ] 1.4 Add AutoMigrate for new tables in model/main.go
- [ ] 1.5 Add CRUD methods for ExternalUserSource
- [ ] 1.6 Add CRUD methods for ExternalUserFieldMapping
- [ ] 1.7 Add methods for ExternalUserSyncLog

## 2. Core Sync Service

- [ ] 2.1 Create service/external_user_sync.go
- [ ] 2.2 Implement ConnectExternalDB function (MySQL/PostgreSQL support)
- [ ] 2.3 Implement FetchExternalUsers function with pagination
- [ ] 2.4 Implement TransformUser function (direct mapping)
- [ ] 2.5 Implement TransformUser function (value mapping)
- [ ] 2.6 Implement SyncUsers function (main sync logic)
- [ ] 2.7 Implement FindOrphanUsers function (detect removed users)
- [ ] 2.8 Implement DisableOrphanUsers function
- [ ] 2.9 Add AES encryption for database passwords

## 3. Cron Integration

- [ ] 3.1 Create service/cron/executor_external_user_sync.go
- [ ] 3.2 Register executor with name "external_user_sync"
- [ ] 3.3 Implement Execute method to iterate enabled sources
- [ ] 3.4 Add default cron task entry in model/cron_task.go
- [ ] 3.5 Test executor with existing scheduler

## 4. REST API

- [ ] 4.1 Create controller/external_user_source.go
- [ ] 4.2 Implement GetAllExternalUserSources (GET /api/external-user-source)
- [ ] 4.3 Implement GetExternalUserSource (GET /api/external-user-source/:id)
- [ ] 4.4 Implement CreateExternalUserSource (POST /api/external-user-source)
- [ ] 4.5 Implement UpdateExternalUserSource (PUT /api/external-user-source/:id)
- [ ] 4.6 Implement DeleteExternalUserSource (DELETE /api/external-user-source/:id)
- [ ] 4.7 Implement TestConnection (POST /api/external-user-source/:id/test)
- [ ] 4.8 Implement ManualSync (POST /api/external-user-source/:id/sync)
- [ ] 4.9 Implement GetMappings (GET /api/external-user-source/:id/mappings)
- [ ] 4.10 Implement UpdateMappings (PUT /api/external-user-source/:id/mappings)
- [ ] 4.11 Implement GetSyncLogs (GET /api/external-user-source/:id/logs)
- [ ] 4.12 Add routes in router/api-router.go with AdminAuth middleware

## 5. Frontend

- [ ] 5.1 Create pages/ExternalUserSource/index.jsx (list page)
- [ ] 5.2 Create pages/ExternalUserSource/components/SourceFormModal.jsx
- [ ] 5.3 Create pages/ExternalUserSource/components/FieldMappingModal.jsx
- [ ] 5.4 Create pages/ExternalUserSource/components/SyncLogModal.jsx
- [ ] 5.5 Add route in App.jsx (/console/external-user-source)
- [ ] 5.6 Add menu item in SiderBar.jsx (Admin section)
- [ ] 5.7 Add to DEFAULT_ADMIN_CONFIG in useSidebar.js
- [ ] 5.8 Build and test frontend

## 6. i18n

- [ ] 6.1 Add Chinese translations for UI labels
- [ ] 6.2 Add English translations for UI labels

## 7. Testing

- [ ] 7.1 Test MySQL connection and sync
- [ ] 7.2 Test PostgreSQL connection and sync
- [ ] 7.3 Test direct field mapping
- [ ] 7.4 Test value mapping for role
- [ ] 7.5 Test value mapping for status
- [ ] 7.6 Test orphan user disable
- [ ] 7.7 Test manual sync trigger
- [ ] 7.8 Test scheduled sync via cron
- [ ] 7.9 Test connection failure handling
- [ ] 7.10 Test missing mapping validation

## 8. Documentation

- [ ] 8.1 Create IMPLEMENTATION_SUMMARY.md
- [ ] 8.2 Document configuration options
- [ ] 8.3 Document API endpoints
