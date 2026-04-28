# External User Sync - Design Document

Date: 2026-04-27

## Overview

This design document specifies the external user synchronization feature that allows organizations to sync users from external MySQL/PostgreSQL databases into the API gateway system. Synced users authenticate via OAuth and have their basic information automatically kept in sync with the external source.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| User Identification | username + empty password | No schema change, matches OAuth user pattern |
| Deleted User Handling | Disable local user (status=2) | Preserves history, allows re-enable if user returns |
| Sync Schedule | Shared cron task | Simpler configuration, iterates all enabled sources |
| Connection Failure | Log error and skip | Allows other sources to continue syncing |
| UI Layout | Simplified table list | Consistent with existing TaskSetting page |
| Field Mapping UI | Table edit mode | Excel-like, efficient for batch configuration |

## Architecture

```
Web UI Layer
├── pages/ExternalUserSource/index.jsx
│   ├── Table list of all sources
│   ├── SourceFormModal (create/edit)
│   ├── FieldMappingModal (table editing)
│   └── SyncLogModal (history)
│
↓ REST API (AdminAuth middleware)
│
Controller Layer
├── controller/external_user_source.go
│   ├── CRUD operations
│   ├── Test connection
│   ├── Manual sync trigger
│   └── Get mappings/logs
│
↓
Service Layer
├── service/external_user_sync.go
│   ├── ConnectExternalDB() - MySQL/PostgreSQL
│   ├── FetchExternalUsers() - Query with pagination
│   ├── TransformUser() - Direct/value mapping
│   ├── SyncUsers() - Main sync logic
│   └── DisableOrphanUsers() - Disable removed users
│
↓
Cron Integration
├── service/cron/executor_external_user_sync.go
│   └── Iterate enabled sources, execute sync
│
↓
Data Models
├── model/external_user_source.go
├── model/external_user_field_mapping.go
└── model/external_user_sync_log.go
```

## Data Models

### ExternalUserSource

```go
type ExternalUserSource struct {
    Id           int    `json:"id" gorm:"primaryKey"`
    Name         string `json:"name" gorm:"unique;not null"`
    DbType       string `json:"db_type" gorm:"not null"`           // mysql, postgresql
    Host         string `json:"host" gorm:"not null"`
    Port         int    `json:"port" gorm:"not null"`
    Database     string `json:"database" gorm:"not null"`
    Username     string `json:"username" gorm:"not null"`
    Password     string `json:"-" gorm:"not null"`                  // Encrypted, not returned to frontend
    TableName    string `json:"table_name" gorm:"not null"`
    QueryWhere   string `json:"query_where"`                        // Optional WHERE clause
    UniqueKey    string `json:"unique_key" gorm:"not null;default:'id'"` // External unique field
    Enabled      int    `json:"enabled" gorm:"type:int;default:0"`  // 0=disabled, 1=enabled
    CreatedAt    int64  `json:"created_at"`
    UpdatedAt    int64  `json:"updated_at"`
}
```

### ExternalUserFieldMapping

```go
type ExternalUserFieldMapping struct {
    Id              int    `json:"id" gorm:"primaryKey"`
    SourceId        int    `json:"source_id" gorm:"index;not null"`
    ExternalField   string `json:"external_field" gorm:"not null"`
    LocalField      string `json:"local_field" gorm:"not null"`        // username, email, display_name, role, status
    TransformType   string `json:"transform_type" gorm:"default:'direct'"` // direct, value_map
    TransformConfig string `json:"transform_config"`                    // JSON: {"teacher":1, "admin":10}
}
```

### ExternalUserSyncLog

```go
type ExternalUserSyncLog struct {
    Id           int    `json:"id" gorm:"primaryKey"`
    SourceId     int    `json:"source_id" gorm:"index"`
    Status       string `json:"status"`                              // success, failed, partial
    Inserted     int    `json:"inserted"`
    Updated      int    `json:"updated"`
    Disabled     int    `json:"disabled"`
    Errors       int    `json:"errors"`
    ErrorDetails string `json:"error_details"`
    StartedAt    int64  `json:"started_at"`
    FinishedAt   int64  `json:"finished_at"`
}
```

## REST API

### Data Source Management

```
GET    /api/external-user-source           - List all sources
GET    /api/external-user-source/:id       - Get source details
POST   /api/external-user-source           - Create source
PUT    /api/external-user-source/:id       - Update source
DELETE /api/external-user-source/:id       - Delete source
POST   /api/external-user-source/:id/test  - Test connection
POST   /api/external-user-source/:id/sync  - Manual sync trigger
```

### Field Mappings

```
GET    /api/external-user-source/:id/mappings  - Get mappings
PUT    /api/external-user-source/:id/mappings  - Update mappings (replace all)
```

### Sync Logs

```
GET    /api/external-user-source/:id/logs  - Get sync logs (paginated)
```

### Request Examples

**Create Source:**
```json
POST /api/external-user-source
{
  "name": "Employee Database",
  "db_type": "mysql",
  "host": "192.168.1.100",
  "port": 3306,
  "database": "hr_system",
  "username": "readonly",
  "password": "secret123",
  "table_name": "employees",
  "query_where": "status = 'active'",
  "unique_key": "employee_id",
  "enabled": 1
}
```

**Update Mappings:**
```json
PUT /api/external-user-source/1/mappings
{
  "mappings": [
    {"external_field": "employee_id", "local_field": "username", "transform_type": "direct"},
    {"external_field": "email", "local_field": "email", "transform_type": "direct"},
    {"external_field": "name", "local_field": "display_name", "transform_type": "direct"},
    {"external_field": "user_type", "local_field": "role", "transform_type": "value_map", "transform_config": "{\"teacher\":1,\"admin\":10}"},
    {"external_field": "status", "local_field": "status", "transform_type": "value_map", "transform_config": "{\"active\":1,\"inactive\":2}"}
  ]
}
```

## Sync Service Logic

### Main Sync Flow

```
1. Connect to external database (MySQL/PostgreSQL)
2. Fetch field mappings for this source
3. Query external users (with optional WHERE clause)
4. For each external user:
   a. Get username from unique_key field
   b. Find local user: WHERE username = ? AND password = ''
   c. If not found: Create new user with empty password (OAuth user)
   d. If found: Update fields according to mappings
5. Find orphan users: WHERE password = '' AND username NOT IN (external_usernames)
6. Disable orphan users: SET status = 2
7. Record sync log with counts
```

### Field Transformation

**Direct Mapping:** Copy field value directly
```
external_field: "employee_id" → local_field: "username"
value: "john123" → "john123"
```

**Value Mapping:** Transform values via JSON config
```
external_field: "user_type" → local_field: "role"
transform_config: {"teacher": 1, "admin": 10}
value: "teacher" → 1
value: "admin" → 10
value: "unknown" → 1 (default)
```

## Cron Integration

### Executor Implementation

```go
// service/cron/executor_external_user_sync.go
func init() {
    RegisterExecutor("external_user_sync", &ExternalUserSyncExecutor{})
}

func (e *ExternalUserSyncExecutor) Execute(task *model.CronTask) (string, error) {
    sources, _ := model.GetEnabledExternalUserSources()
    var results []string
    
    for _, source := range sources {
        log, err := service.SyncUsers(source)
        if err != nil {
            results = append(results, fmt.Sprintf("%s: Failed - %s", source.Name, err))
        } else {
            results = append(results, fmt.Sprintf("%s: +%d ~%d x%d", 
                source.Name, log.Inserted, log.Updated, log.Disabled))
        }
    }
    
    return strings.Join(results, "; "), nil
}
```

### Default Cron Task

Add to default cron tasks in `model/cron_task.go`:
```go
{Name: "external_user_sync", CronExpression: "0 */6 * * * *", Enabled: false}
// Every 6 hours, disabled by default
```

## Frontend Structure

```
web/src/pages/ExternalUserSource/
├── index.jsx                    # Main page with table
├── components/
│   ├── SourceFormModal.jsx      # Create/Edit source form
│   ├── FieldMappingModal.jsx    # Table editor for mappings
│   └── SyncLogModal.jsx         # Sync history viewer
```

### Key UI Components

**SourceFormModal:**
- Form fields: Name, DB Type, Host, Port, Database, Username, Password, Table Name, Query Where, Unique Key
- "Test Connection" button
- Password field with visibility toggle

**FieldMappingModal:**
- Semi Table with editable cells
- Columns: External Field (input), Local Field (select), Transform Type (select), Transform Config (JSON editor button)
- Add/Remove row buttons
- Save button (replaces all mappings)

**SyncLogModal:**
- Table: Timestamp, Status, Inserted, Updated, Disabled, Errors, Details
- Pagination
- Status badges (success=green, failed=red, partial=orange)

## Error Handling

| Scenario | Handling |
|----------|----------|
| External DB connection failed | Log error, skip source, continue with other sources |
| External DB query failed | Mark sync as failed, record error details |
| Single user transform failed | Log error, continue other users, errors++ |
| Value mapping not found | Use default values (role=1, status=1) |
| Username collision (non-empty password) | Skip user, log warning |
| External field is NULL | Skip field, preserve local value |

## Security

### Password Encryption

```go
func EncryptPassword(plaintext string) (string, error) {
    key := []byte(os.Getenv("AES_KEY")) // 32 bytes for AES-256
    block, _ := aes.NewCipher(key)
    gcm, _ := cipher.NewGCM(block)
    nonce := make([]byte, gcm.NonceSize())
    io.ReadFull(rand.Reader, nonce)
    ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}
```

### Security Measures

1. **Encrypted Storage**: Database passwords encrypted with AES-256-GCM
2. **API Protection**: Password field excluded from JSON responses (`json:"-"`)
3. **Log Sanitization**: Connection strings logged with passwords masked
4. **Access Control**: All endpoints require AdminAuth middleware
5. **Read-Only Access**: Recommend using read-only database users for external connections

## Database Compatibility

### Supported Databases

- MySQL >= 5.7.8
- PostgreSQL >= 9.6

### Connection Strings

**MySQL:**
```
username:password@tcp(host:port)/database?charset=utf8mb4
```

**PostgreSQL:**
```
host=host port=port user=username password=password dbname=database sslmode=disable
```

### SQL Compatibility

- Use standard SQL syntax
- Avoid database-specific functions
- Handle column quoting differences (MySQL: backticks, PostgreSQL: double quotes)
- Boolean values: Use integers (0/1) instead of database-specific boolean types

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| External DB unavailable during sync | Log error, skip source, continue with others |
| Username collision with non-OAuth user | Skip with warning (password not empty = not our user) |
| Large user count (10k+) | Batch processing with configurable page size (default: 500) |
| User deleted then recreated | Gets disabled; next sync re-enables if found again |
| Value mapping missing | Use default values (role=1, status=1) |
| Connection string leak in logs | Mask password in all log output |

## Out of Scope

- Real-time sync (scheduled batch only)
- Password synchronization (OAuth users have empty password)
- External DB user creation/modification
- Handling external DB schema changes (admin must update config)
- Changes to existing OAuth authentication flow

## Implementation Notes

### Required Environment Variable

- `AES_KEY`: 32-byte key for AES-256 password encryption (must be set in environment)

### Database Migration

Add to `model/main.go` AutoMigrate:
```go
db.AutoMigrate(&ExternalUserSource{})
db.AutoMigrate(&ExternalUserFieldMapping{})
db.AutoMigrate(&ExternalUserSyncLog{})
```

### Default Cron Task Name

- Task name: `external_user_sync`
- Default schedule: `0 */6 * * * *` (every 6 hours)
- Default enabled: `false` (admin must enable after configuration)

### Frontend Route

- Route path: `/console/external-user-source`
- Menu location: Admin section (requires role >= 10)
- i18n keys: Add to `web/src/i18n/locales/zh.json` and `en.json`
