# External User Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement external user synchronization from MySQL/PostgreSQL databases with Web UI configuration, scheduled sync, and field mapping support.

**Architecture:** Layered architecture with data models, sync service, cron executor, REST API, and React frontend. Reuses existing cron framework for scheduling.

**Tech Stack:** Go 1.22+, Gin, GORM, React 18, Semi Design, robfig/cron v3

---

## Task 1: Data Models

**Files:**
- Create: `new-api/model/external_user_source.go`
- Create: `new-api/model/external_user_field_mapping.go`
- Create: `new-api/model/external_user_sync_log.go`
- Modify: `new-api/model/main.go` (add AutoMigrate)

- [ ] **Step 1: Create ExternalUserSource model**

Create `new-api/model/external_user_source.go`:

```go
package model

import (
	"time"
)

type ExternalUserSource struct {
	Id           int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name         string `json:"name" gorm:"unique;not null;size:100"`
	DbType       string `json:"db_type" gorm:"not null;size:20"` // mysql, postgresql
	Host         string `json:"host" gorm:"not null;size:255"`
	Port         int    `json:"port" gorm:"not null"`
	Database     string `json:"database" gorm:"not null;size:100"`
	Username     string `json:"username" gorm:"not null;size:100"`
	Password     string `json:"-" gorm:"not null;size:255"` // Encrypted, not returned to frontend
	TableName    string `json:"table_name" gorm:"not null;size:100;column:table_name"`
	QueryWhere   string `json:"query_where" gorm:"size:500;column:query_where"`
	UniqueKey    string `json:"unique_key" gorm:"not null;size:50;default:'id';column:unique_key"`
	Enabled      int    `json:"enabled" gorm:"type:int;default:0"`
	CreatedAt    int64  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    int64  `json:"updated_at" gorm:"autoUpdateTime"`
}

func (ExternalUserSource) TableName() string {
	return "external_user_sources"
}

func GetExternalUserSourceByID(id int) (*ExternalUserSource, error) {
	var source ExternalUserSource
	err := DB.Where("id = ?", id).First(&source).Error
	return &source, err
}

func GetAllExternalUserSources() ([]*ExternalUserSource, error) {
	var sources []*ExternalUserSource
	err := DB.Find(&sources).Error
	return sources, err
}

func GetEnabledExternalUserSources() ([]*ExternalUserSource, error) {
	var sources []*ExternalUserSource
	err := DB.Where("enabled = ?", 1).Find(&sources).Error
	return sources, err
}

func (s *ExternalUserSource) Insert() error {
	s.CreatedAt = time.Now().Unix()
	s.UpdatedAt = time.Now().Unix()
	return DB.Create(s).Error
}

func (s *ExternalUserSource) Update() error {
	s.UpdatedAt = time.Now().Unix()
	return DB.Save(s).Error
}

func (s *ExternalUserSource) Delete() error {
	return DB.Delete(s).Error
}
```

- [ ] **Step 2: Create ExternalUserFieldMapping model**

Create `new-api/model/external_user_field_mapping.go`:

```go
package model

type ExternalUserFieldMapping struct {
	Id              int    `json:"id" gorm:"primaryKey;autoIncrement"`
	SourceId        int    `json:"source_id" gorm:"index;not null;column:source_id"`
	ExternalField   string `json:"external_field" gorm:"not null;size:100;column:external_field"`
	LocalField      string `json:"local_field" gorm:"not null;size:50;column:local_field"` // username, email, display_name, role, status
	TransformType   string `json:"transform_type" gorm:"size:20;default:'direct';column:transform_type"` // direct, value_map
	TransformConfig string `json:"transform_config" gorm:"type:text;column:transform_config"` // JSON: {"teacher":1, "admin":10}
}

func (ExternalUserFieldMapping) TableName() string {
	return "external_user_field_mappings"
}

func GetMappingsBySourceId(sourceId int) ([]*ExternalUserFieldMapping, error) {
	var mappings []*ExternalUserFieldMapping
	err := DB.Where("source_id = ?", sourceId).Find(&mappings).Error
	return mappings, err
}

func DeleteMappingsBySourceId(sourceId int) error {
	return DB.Where("source_id = ?", sourceId).Delete(&ExternalUserFieldMapping{}).Error
}

func (m *ExternalUserFieldMapping) Insert() error {
	return DB.Create(m).Error
}

func BatchInsertMappings(mappings []*ExternalUserFieldMapping) error {
	if len(mappings) == 0 {
		return nil
	}
	return DB.Create(&mappings).Error
}
```

- [ ] **Step 3: Create ExternalUserSyncLog model**

Create `new-api/model/external_user_sync_log.go`:

```go
package model

import (
	"time"
)

type ExternalUserSyncLog struct {
	Id           int    `json:"id" gorm:"primaryKey;autoIncrement"`
	SourceId     int    `json:"source_id" gorm:"index;not null;column:source_id"`
	Status       string `json:"status" gorm:"size:20"` // success, failed, partial
	Inserted     int    `json:"inserted"`
	Updated      int    `json:"updated"`
	Disabled     int    `json:"disabled"`
	Errors       int    `json:"errors"`
	ErrorDetails string `json:"error_details" gorm:"type:text;column:error_details"`
	StartedAt    int64  `json:"started_at" gorm:"column:started_at"`
	FinishedAt   int64  `json:"finished_at" gorm:"column:finished_at"`
}

func (ExternalUserSyncLog) TableName() string {
	return "external_user_sync_logs"
}

func GetSyncLogsBySourceId(sourceId int, page int, pageSize int) ([]*ExternalUserSyncLog, int64, error) {
	var logs []*ExternalUserSyncLog
	var total int64

	offset := (page - 1) * pageSize
	err := DB.Model(&ExternalUserSyncLog{}).Where("source_id = ?", sourceId).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = DB.Where("source_id = ?", sourceId).Order("id DESC").Offset(offset).Limit(pageSize).Find(&logs).Error
	return logs, total, err
}

func (l *ExternalUserSyncLog) Insert() error {
	return DB.Create(l).Error
}

func CreateSyncLog(sourceId int) *ExternalUserSyncLog {
	return &ExternalUserSyncLog{
		SourceId:  sourceId,
		Status:    "running",
		StartedAt: time.Now().Unix(),
	}
}

func (l *ExternalUserSyncLog) Save() error {
	l.FinishedAt = time.Now().Unix()
	return DB.Save(l).Error
}
```

- [ ] **Step 4: Add AutoMigrate in model/main.go**

Read `new-api/model/main.go` and find the AutoMigrate section (around line 60-80). Add the new models:

```go
err = db.AutoMigrate(
	&User{},
	&Token{},
	// ... existing models ...
	&ExternalUserSource{},
	&ExternalUserFieldMapping{},
	&ExternalUserSyncLog{},
)
```

- [ ] **Step 5: Commit data models**

```bash
git add new-api/model/external_user_source.go
git add new-api/model/external_user_field_mapping.go
git add new-api/model/external_user_sync_log.go
git add new-api/model/main.go
git commit -m "feat: add external user sync data models"
```

---

## Task 2: Password Encryption Utilities

**Files:**
- Create: `new-api/service/crypto.go`

- [ ] **Step 1: Create crypto service for password encryption**

Create `new-api/service/crypto.go`:

```go
package service

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"io"
	"os"
)

var aesKey []byte

func InitAESKey() error {
	key := os.Getenv("AES_KEY")
	if len(key) != 32 {
		// Generate a default key if not set (for development only)
		key = "default-aes-key-32-bytes-length!"
	}
	aesKey = []byte(key)
	return nil
}

func EncryptPassword(plaintext string) (string, error) {
	if len(aesKey) == 0 {
		if err := InitAESKey(); err != nil {
			return "", err
		}
	}

	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func DecryptPassword(ciphertext string) (string, error) {
	if len(aesKey) == 0 {
		if err := InitAESKey(); err != nil {
			return "", err
		}
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}
```

- [ ] **Step 2: Commit crypto utilities**

```bash
git add new-api/service/crypto.go
git commit -m "feat: add AES encryption for database passwords"
```

---

## Task 3: External User Sync Service

**Files:**
- Create: `new-api/service/external_user_sync.go`

- [ ] **Step 1: Create sync service - connection functions**

Create `new-api/service/external_user_sync.go` with database connection functions:

```go
package service

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
)

func ConnectExternalDB(source *model.ExternalUserSource) (*sql.DB, error) {
	password, err := DecryptPassword(source.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt password: %v", err)
	}

	var dsn string
	var driver string

	switch source.DbType {
	case "mysql":
		driver = "mysql"
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=true",
			source.Username, password, source.Host, source.Port, source.Database)
	case "postgresql":
		driver = "postgres"
		dsn = fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
			source.Host, source.Port, source.Username, password, source.Database)
	default:
		return nil, fmt.Errorf("unsupported database type: %s", source.DbType)
	}

	db, err := sql.Open(driver, dsn)
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		return nil, err
	}

	return db, nil
}

func MaskConnectionString(connStr string) string {
	return regexp.MustCompile(`password=[^@\s]+`).ReplaceAllString(connStr, "password=***")
}
```

- [ ] **Step 2: Add fetch and transform functions**

Add to `new-api/service/external_user_sync.go`:

```go
func FetchExternalUsers(db *sql.DB, source *model.ExternalUserSource, mappings []*model.ExternalUserFieldMapping) ([]map[string]interface{}, error) {
	// Build SELECT clause
	var externalFields []string
	for _, m := range mappings {
		externalFields = append(externalFields, m.ExternalField)
	}
	externalFields = append(externalFields, source.UniqueKey)

	// Quote field names based on DB type
	var quotedFields []string
	quoteChar := "`"
	if source.DbType == "postgresql" {
		quoteChar = `"`
	}
	for _, f := range externalFields {
		quotedFields = append(quotedFields, quoteChar+f+quoteChar)
	}

	query := fmt.Sprintf("SELECT %s FROM %s", strings.Join(quotedFields, ", "), source.TableName)
	if source.QueryWhere != "" {
		query += " WHERE " + source.QueryWhere
	}

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("query failed: %v", err)
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	var users []map[string]interface{}
	for rows.Next() {
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))
		for i := range values {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, err
		}

		user := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			switch v := val.(type) {
			case []byte:
				user[col] = string(v)
			default:
				user[col] = v
			}
		}
		users = append(users, user)
	}

	return users, rows.Err()
}

func parseValueMap(config string) map[string]interface{} {
	var result map[string]interface{}
	if err := json.Unmarshal([]byte(config), &result); err != nil {
		return make(map[string]interface{})
	}
	return result
}

func TransformUser(extUser map[string]interface{}, mappings []*model.ExternalUserFieldMapping) *model.User {
	user := &model.User{
		Role:   1, // Default role
		Status: 1, // Default status (enabled)
	}

	for _, m := range mappings {
		extValue := extUser[m.ExternalField]
		if extValue == nil {
			continue
		}

		if m.TransformType == "direct" {
			setUserField(user, m.LocalField, fmt.Sprint(extValue))
		} else if m.TransformType == "value_map" {
			config := parseValueMap(m.TransformConfig)
			key := fmt.Sprint(extValue)
			if mappedValue, ok := config[key]; ok {
				switch m.LocalField {
				case "role":
					if val, ok := mappedValue.(float64); ok {
						user.Role = int(val)
					} else if val, ok := mappedValue.(int); ok {
						user.Role = val
					}
				case "status":
					if val, ok := mappedValue.(float64); ok {
						user.Status = int(val)
					} else if val, ok := mappedValue.(int); ok {
						user.Status = val
					}
				}
			} else {
				// Use default values
				if m.LocalField == "role" {
					user.Role = 1
				} else if m.LocalField == "status" {
					user.Status = 1
				}
			}
		}
	}

	return user
}

func setUserField(user *model.User, field string, value string) {
	switch field {
	case "username":
		user.Username = value
	case "email":
		user.Email = value
	case "display_name":
		user.DisplayName = value
	}
}
```

- [ ] **Step 3: Add main sync logic**

Add to `new-api/service/external_user_sync.go`:

```go
func SyncUsers(source *model.ExternalUserSource) (*model.ExternalUserSyncLog, error) {
	log := model.CreateSyncLog(source.Id)

	// 1. Connect to external database
	db, err := ConnectExternalDB(source)
	if err != nil {
		log.Status = "failed"
		log.ErrorDetails = "Connection failed: " + err.Error()
		log.Save()
		return log, err
	}
	defer db.Close()

	// 2. Get field mappings
	mappings, err := model.GetMappingsBySourceId(source.Id)
	if err != nil {
		log.Status = "failed"
		log.ErrorDetails = "Failed to get mappings: " + err.Error()
		log.Save()
		return log, err
	}

	if len(mappings) == 0 {
		log.Status = "failed"
		log.ErrorDetails = "No field mappings configured"
		log.Save()
		return log, fmt.Errorf("no field mappings configured")
	}

	// 3. Query external users
	externalUsers, err := FetchExternalUsers(db, source, mappings)
	if err != nil {
		log.Status = "failed"
		log.ErrorDetails = "Query failed: " + err.Error()
		log.Save()
		return log, err
	}

	// 4. Process each user
	externalUsernames := []string{}
	for _, extUser := range externalUsers {
		username := fmt.Sprint(extUser[source.UniqueKey])
		if username == "" {
			log.Errors++
			continue
		}
		externalUsernames = append(externalUsernames, username)

		// Find local user: username matches and password is empty
		localUser, err := model.GetUserByUsername(username)
		if err == nil && localUser != nil {
			// Check if it's an OAuth user (password empty)
			if localUser.Password != "" {
				// Not our user, skip
				logger.SysLog(fmt.Sprintf("Skipping user %s: non-OAuth user", username))
				continue
			}
			// Update existing user
			UpdateUserFromExternal(localUser, extUser, mappings)
			log.Updated++
		} else {
			// Create new user
			user := TransformUser(extUser, mappings)
			user.Username = username
			user.Password = "" // OAuth user
			if err := user.Insert(-1); err != nil {
				logger.SysLog(fmt.Sprintf("Failed to create user %s: %v", username, err))
				log.Errors++
			} else {
				log.Inserted++
			}
		}
	}

	// 5. Disable orphan users
	disabledCount, err := DisableOrphanUsers(source.Id, externalUsernames)
	if err != nil {
		logger.SysLog(fmt.Sprintf("Failed to disable orphan users: %v", err))
	} else {
		log.Disabled = disabledCount
	}

	// 6. Save sync log
	if log.Errors > 0 {
		log.Status = "partial"
	} else {
		log.Status = "success"
	}
	log.Save()

	return log, nil
}

func UpdateUserFromExternal(user *model.User, extUser map[string]interface{}, mappings []*model.ExternalUserFieldMapping) {
	for _, m := range mappings {
		extValue := extUser[m.ExternalField]
		if extValue == nil {
			continue
		}

		if m.TransformType == "direct" {
			setUserField(user, m.LocalField, fmt.Sprint(extValue))
		} else if m.TransformType == "value_map" {
			config := parseValueMap(m.TransformConfig)
			key := fmt.Sprint(extValue)
			if mappedValue, ok := config[key]; ok {
				switch m.LocalField {
				case "role":
					if val, ok := mappedValue.(float64); ok {
						user.Role = int(val)
					} else if val, ok := mappedValue.(int); ok {
						user.Role = val
					}
				case "status":
					if val, ok := mappedValue.(float64); ok {
						user.Status = int(val)
					} else if val, ok := mappedValue.(int); ok {
						user.Status = val
					}
				}
			}
		}
	}
	user.Update(false)
}

func DisableOrphanUsers(sourceId int, activeUsernames []string) (int, error) {
	if len(activeUsernames) == 0 {
		return 0, nil
	}

	result := model.DB.Model(&model.User{}).
		Where("password = ''").
		Where("username NOT IN ?", activeUsernames).
		Update("status", 2) // 2 = disabled

	return int(result.RowsAffected), result.Error
}
```

- [ ] **Step 4: Commit sync service**

```bash
git add new-api/service/external_user_sync.go
git commit -m "feat: add external user sync service"
```

---

## Task 4: Cron Executor

**Files:**
- Create: `new-api/service/cron/executor_external_user_sync.go`
- Modify: `new-api/service/cron/registry.go`
- Modify: `new-api/model/cron_task.go`

- [ ] **Step 1: Create cron executor**

Create `new-api/service/cron/executor_external_user_sync.go`:

```go
package cron

import (
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
)

type ExternalUserSyncExecutor struct{}

func (e *ExternalUserSyncExecutor) Execute(task *model.CronTask) (string, error) {
	sources, err := model.GetEnabledExternalUserSources()
	if err != nil {
		return "", fmt.Errorf("failed to get enabled sources: %v", err)
	}

	if len(sources) == 0 {
		return "No enabled external user sources", nil
	}

	var results []string
	for _, source := range sources {
		log, err := service.SyncUsers(source)
		if err != nil {
			results = append(results, fmt.Sprintf("%s: Failed - %s", source.Name, err.Error()))
		} else {
			results = append(results, fmt.Sprintf("%s: +%d ~%d x%d",
				source.Name, log.Inserted, log.Updated, log.Disabled))
		}
	}

	return strings.Join(results, "; "), nil
}

func init() {
	RegisterExecutor("external_user_sync", &ExternalUserSyncExecutor{})
}
```

- [ ] **Step 2: Add default cron task**

Read `new-api/model/cron_task.go` and find the defaultTasks variable. Add:

```go
var defaultTasks = []DefaultCronTask{
	// ... existing tasks ...
	{Name: "external_user_sync", CronExpression: "0 0 */6 * * *", Enabled: false}, // Every 6 hours, disabled by default
}
```

- [ ] **Step 3: Commit cron executor**

```bash
git add new-api/service/cron/executor_external_user_sync.go
git add new-api/model/cron_task.go
git commit -m "feat: add external user sync cron executor"
```

---

## Task 5: REST API Controller

**Files:**
- Create: `new-api/controller/external_user_source.go`
- Modify: `new-api/router/api-router.go`

- [ ] **Step 1: Create controller - basic CRUD**

Create `new-api/controller/external_user_source.go`:

```go
package controller

import (
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

func GetAllExternalUserSources(c *gin.Context) {
	sources, err := model.GetAllExternalUserSources()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": sources})
}

func GetExternalUserSource(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	source, err := model.GetExternalUserSourceByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "source not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": source})
}

func CreateExternalUserSource(c *gin.Context) {
	var source model.ExternalUserSource
	if err := c.ShouldBindJSON(&source); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Encrypt password
	encryptedPassword, err := service.EncryptPassword(source.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to encrypt password"})
		return
	}
	source.Password = encryptedPassword

	if err := source.Insert(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": source})
}

func UpdateExternalUserSource(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	source, err := model.GetExternalUserSourceByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "source not found"})
		return
	}

	var updates model.ExternalUserSource
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Encrypt password if provided
	if updates.Password != "" {
		encryptedPassword, err := service.EncryptPassword(updates.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to encrypt password"})
			return
		}
		source.Password = encryptedPassword
	}

	source.Name = updates.Name
	source.DbType = updates.DbType
	source.Host = updates.Host
	source.Port = updates.Port
	source.Database = updates.Database
	source.Username = updates.Username
	source.TableName = updates.TableName
	source.QueryWhere = updates.QueryWhere
	source.UniqueKey = updates.UniqueKey
	source.Enabled = updates.Enabled

	if err := source.Update(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": source})
}

func DeleteExternalUserSource(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	source, err := model.GetExternalUserSourceByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "source not found"})
		return
	}

	// Delete mappings first
	model.DeleteMappingsBySourceId(id)

	if err := source.Delete(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
```

- [ ] **Step 2: Add test connection and sync endpoints**

Add to `new-api/controller/external_user_source.go`:

```go
func TestExternalUserSourceConnection(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	source, err := model.GetExternalUserSourceByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "source not found"})
		return
	}

	db, err := service.ConnectExternalDB(source)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer db.Close()

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Connection successful"})
}

func ManualSyncExternalUserSource(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	source, err := model.GetExternalUserSourceByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "source not found"})
		return
	}

	log, err := service.SyncUsers(source)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "error": err.Error(), "log": log})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "log": log})
}
```

- [ ] **Step 3: Add mapping endpoints**

Add to `new-api/controller/external_user_source.go`:

```go
func GetExternalUserSourceMappings(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	mappings, err := model.GetMappingsBySourceId(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": mappings})
}

func UpdateExternalUserSourceMappings(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req struct {
		Mappings []*model.ExternalUserFieldMapping `json:"mappings"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Delete existing mappings
	if err := model.DeleteMappingsBySourceId(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Set source ID for all mappings
	for _, m := range req.Mappings {
		m.SourceId = id
	}

	// Batch insert
	if err := model.BatchInsertMappings(req.Mappings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": req.Mappings})
}
```

- [ ] **Step 4: Add sync log endpoint**

Add to `new-api/controller/external_user_source.go`:

```go
func GetExternalUserSourceSyncLogs(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	logs, total, err := model.GetSyncLogsBySourceId(id, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": logs, "total": total})
}
```

- [ ] **Step 5: Add routes to api-router.go**

Read `new-api/router/api-router.go` and find the admin routes section. Add:

```go
// External user source routes
externalUserSourceRoute := apiRouter.Group("/external-user-source")
externalUserSourceRoute.Use(middleware.AdminAuth())
{
	externalUserSourceRoute.GET("", controller.GetAllExternalUserSources)
	externalUserSourceRoute.GET("/:id", controller.GetExternalUserSource)
	externalUserSourceRoute.POST("", controller.CreateExternalUserSource)
	externalUserSourceRoute.PUT("/:id", controller.UpdateExternalUserSource)
	externalUserSourceRoute.DELETE("/:id", controller.DeleteExternalUserSource)
	externalUserSourceRoute.POST("/:id/test", controller.TestExternalUserSourceConnection)
	externalUserSourceRoute.POST("/:id/sync", controller.ManualSyncExternalUserSource)
	externalUserSourceRoute.GET("/:id/mappings", controller.GetExternalUserSourceMappings)
	externalUserSourceRoute.PUT("/:id/mappings", controller.UpdateExternalUserSourceMappings)
	externalUserSourceRoute.GET("/:id/logs", controller.GetExternalUserSourceSyncLogs)
}
```

- [ ] **Step 6: Commit controller and routes**

```bash
git add new-api/controller/external_user_source.go
git add new-api/router/api-router.go
git commit -m "feat: add external user source REST API endpoints"
```

---

## Task 6: Frontend - Main Page

**Files:**
- Create: `web/src/pages/ExternalUserSource/index.jsx`

- [ ] **Step 1: Create main page component**

Create `web/src/pages/ExternalUserSource/index.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { Button, Table, Popconfirm, Typography, Tag, Space, Toast } from '@douyinfe/semi-ui';
import { IconPlus, IconEdit, IconDelete, IconRefresh, IconLink, IconSetting } from '@douyinfe/semi-icons';
import { API } from '../../helpers/api';
import SourceFormModal from './components/SourceFormModal';
import FieldMappingModal from './components/FieldMappingModal';
import SyncLogModal from './components/SyncLogModal';

const { Title } = Typography;

const ExternalUserSource = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [mappingVisible, setMappingVisible] = useState(false);
  const [logVisible, setLogVisible] = useState(false);
  const [currentSource, setCurrentSource] = useState(null);

  const loadSources = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/external-user-source');
      setSources(res.data.data || []);
    } catch (err) {
      Toast.error('Failed to load sources');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleTest = async (id) => {
    try {
      const res = await API.post(`/api/external-user-source/${id}/test`);
      if (res.data.success) {
        Toast.success('Connection successful');
      } else {
        Toast.error(res.data.error || 'Connection failed');
      }
    } catch (err) {
      Toast.error('Test failed');
    }
  };

  const handleSync = async (id) => {
    try {
      const res = await API.post(`/api/external-user-source/${id}/sync`);
      if (res.data.success) {
        Toast.success(`Sync completed: +${res.data.log.inserted} ~${res.data.log.updated} x${res.data.log.disabled}`);
        loadSources();
      } else {
        Toast.error(res.data.error || 'Sync failed');
      }
    } catch (err) {
      Toast.error('Sync failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/api/external-user-source/${id}`);
      Toast.success('Deleted');
      loadSources();
    } catch (err) {
      Toast.error('Delete failed');
    }
  };

  const handleEdit = (record) => {
    setCurrentSource(record);
    setFormVisible(true);
  };

  const handleMapping = (record) => {
    setCurrentSource(record);
    setMappingVisible(true);
  };

  const handleLog = (record) => {
    setCurrentSource(record);
    setLogVisible(true);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'db_type',
      key: 'db_type',
      render: (text) => <Tag color={text === 'mysql' ? 'blue' : 'green'}>{text.toUpperCase()}</Tag>,
    },
    {
      title: 'Host',
      dataIndex: 'host',
      key: 'host',
      render: (text, record) => `${text}:${record.port}`,
    },
    {
      title: 'Table',
      dataIndex: 'table_name',
      key: 'table_name',
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled) => (
        <Tag color={enabled === 1 ? 'green' : 'grey'}>
          {enabled === 1 ? 'Enabled' : 'Disabled'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space>
          <Button icon={<IconLink />} size="small" onClick={() => handleTest(record.id)}>Test</Button>
          <Button icon={<IconRefresh />} size="small" onClick={() => handleSync(record.id)}>Sync</Button>
          <Button icon={<IconSetting />} size="small" onClick={() => handleMapping(record)}>Mapping</Button>
          <Button icon={<IconEdit />} size="small" onClick={() => handleEdit(record)}>Edit</Button>
          <Button icon={<IconDelete />} size="small" onClick={() => handleLog(record)}>Logs</Button>
          <Popconfirm
            title="Delete this source?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<IconDelete />} size="small" type="danger">Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title heading={3}>External User Sources</Title>
      <Button
        icon={<IconPlus />}
        style={{ marginBottom: 16 }}
        onClick={() => { setCurrentSource(null); setFormVisible(true); }}
      >
        Add Source
      </Button>
      <Table
        columns={columns}
        dataSource={sources}
        rowKey="id"
        loading={loading}
      />
      <SourceFormModal
        visible={formVisible}
        source={currentSource}
        onCancel={() => setFormVisible(false)}
        onSuccess={() => { setFormVisible(false); loadSources(); }}
      />
      <FieldMappingModal
        visible={mappingVisible}
        source={currentSource}
        onCancel={() => setMappingVisible(false)}
        onSuccess={() => setMappingVisible(false)}
      />
      <SyncLogModal
        visible={logVisible}
        source={currentSource}
        onCancel={() => setLogVisible(false)}
      />
    </div>
  );
};

export default ExternalUserSource;
```

- [ ] **Step 2: Commit main page**

```bash
git add web/src/pages/ExternalUserSource/index.jsx
git commit -m "feat: add external user source main page"
```

---

## Task 7: Frontend - Source Form Modal

**Files:**
- Create: `web/src/pages/ExternalUserSource/components/SourceFormModal.jsx`

- [ ] **Step 1: Create source form modal**

Create `web/src/pages/ExternalUserSource/components/SourceFormModal.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, Toast, Space } from '@douyinfe/semi-ui';
import { API } from '../../../helpers/api';

const SourceFormModal = ({ visible, source, onCancel, onSuccess }) => {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (source) {
        setForm({
          name: source.name,
          db_type: source.db_type,
          host: source.host,
          port: source.port,
          database: source.database,
          username: source.username,
          password: '',
          table_name: source.table_name,
          query_where: source.query_where || '',
          unique_key: source.unique_key,
          enabled: source.enabled,
        });
      } else {
        setForm({
          db_type: 'mysql',
          port: 3306,
          unique_key: 'id',
          enabled: 0,
        });
      }
    }
  }, [visible, source]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = { ...form };
      if (source && !data.password) {
        delete data.password;
      }

      if (source) {
        await API.put(`/api/external-user-source/${source.id}`, data);
        Toast.success('Updated');
      } else {
        await API.post('/api/external-user-source', data);
        Toast.success('Created');
      }
      onSuccess();
    } catch (err) {
      Toast.error(source ? 'Update failed' : 'Create failed');
    }
    setLoading(false);
  };

  const handleTest = async () => {
    if (!form.host || !form.port || !form.database || !form.username) {
      Toast.warning('Please fill connection fields first');
      return;
    }

    setTesting(true);
    try {
      const tempData = {
        ...form,
        password: form.password || (source ? 'dummy' : ''),
      };
      
      // Create temp source to test
      const res = await API.post('/api/external-user-source', tempData);
      if (res.data.data?.id) {
        const testRes = await API.post(`/api/external-user-source/${res.data.data.id}/test`);
        await API.delete(`/api/external-user-source/${res.data.data.id}`);
        if (testRes.data.success) {
          Toast.success('Connection successful');
        } else {
          Toast.error(testRes.data.error || 'Connection failed');
        }
      }
    } catch (err) {
      Toast.error('Test failed');
    }
    setTesting(false);
  };

  return (
    <Modal
      title={source ? 'Edit Source' : 'Add Source'}
      visible={visible}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={handleTest} loading={testing}>Test Connection</Button>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>Save</Button>
        </Space>
      }
      style={{ width: 600 }}
    >
      <Form form={form.api} onSubmit={handleSubmit}>
        <Form.Input field="name" label="Name" rules={[{ required: true }]} />
        <Form.Select field="db_type" label="Database Type" rules={[{ required: true }]}>
          <Select.Option value="mysql">MySQL</Select.Option>
          <Select.Option value="postgresql">PostgreSQL</Select.Option>
        </Form.Select>
        <Form.Input field="host" label="Host" rules={[{ required: true }]} placeholder="192.168.1.100" />
        <Form.InputNumber field="port" label="Port" rules={[{ required: true }]} />
        <Form.Input field="database" label="Database" rules={[{ required: true }]} />
        <Form.Input field="username" label="Username" rules={[{ required: true }]} />
        <Form.Input
          field="password"
          label="Password"
          type="password"
          placeholder={source ? 'Leave empty to keep current' : ''}
          rules={source ? [] : [{ required: true }]}
        />
        <Form.Input field="table_name" label="Table Name" rules={[{ required: true }]} placeholder="employees" />
        <Form.Input field="query_where" label="WHERE Clause (optional)" placeholder="status = 'active'" />
        <Form.Input field="unique_key" label="Unique Key Field" rules={[{ required: true }]} placeholder="employee_id" />
        <Form.Switch field="enabled" label="Enabled" />
      </Form>
    </Modal>
  );
};

export default SourceFormModal;
```

- [ ] **Step 2: Commit source form modal**

```bash
git add web/src/pages/ExternalUserSource/components/SourceFormModal.jsx
git commit -m "feat: add source form modal component"
```

---

## Task 8: Frontend - Field Mapping Modal

**Files:**
- Create: `web/src/pages/ExternalUserSource/components/FieldMappingModal.jsx`

- [ ] **Step 1: Create field mapping modal**

Create `web/src/pages/ExternalUserSource/components/FieldMappingModal.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Input, Select, Space, Toast, Popconfirm, InputNumber } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';
import { API } from '../../../helpers/api';

const localFields = [
  { value: 'username', label: 'Username' },
  { value: 'email', label: 'Email' },
  { value: 'display_name', label: 'Display Name' },
  { value: 'role', label: 'Role' },
  { value: 'status', label: 'Status' },
];

const FieldMappingModal = ({ visible, source, onCancel, onSuccess }) => {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadMappings = async () => {
    if (!source) return;
    setLoading(true);
    try {
      const res = await API.get(`/api/external-user-source/${source.id}/mappings`);
      setMappings(res.data.data || []);
    } catch (err) {
      Toast.error('Failed to load mappings');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      loadMappings();
    }
  }, [visible, source]);

  const handleAdd = () => {
    setMappings([...mappings, {
      id: Date.now(),
      external_field: '',
      local_field: 'username',
      transform_type: 'direct',
      transform_config: '',
    }]);
  };

  const handleDelete = (index) => {
    const newMappings = mappings.filter((_, i) => i !== index);
    setMappings(newMappings);
  };

  const handleChange = (index, field, value) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setMappings(newMappings);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = mappings.map(m => ({
        external_field: m.external_field,
        local_field: m.local_field,
        transform_type: m.transform_type,
        transform_config: m.transform_config,
      }));
      await API.put(`/api/external-user-source/${source.id}/mappings`, { mappings: data });
      Toast.success('Saved');
      onSuccess();
    } catch (err) {
      Toast.error('Save failed');
    }
    setSaving(false);
  };

  const columns = [
    {
      title: 'External Field',
      dataIndex: 'external_field',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => handleChange(index, 'external_field', e)}
          placeholder="e.g., employee_id"
        />
      ),
    },
    {
      title: 'Local Field',
      dataIndex: 'local_field',
      render: (text, record, index) => (
        <Select
          value={text}
          onChange={(value) => handleChange(index, 'local_field', value)}
          style={{ width: 120 }}
        >
          {localFields.map(f => (
            <Select.Option key={f.value} value={f.value}>{f.label}</Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Transform Type',
      dataIndex: 'transform_type',
      render: (text, record, index) => (
        <Select
          value={text}
          onChange={(value) => handleChange(index, 'transform_type', value)}
          style={{ width: 100 }}
        >
          <Select.Option value="direct">Direct</Select.Option>
          <Select.Option value="value_map">Value Map</Select.Option>
        </Select>
      ),
    },
    {
      title: 'Transform Config',
      dataIndex: 'transform_config',
      render: (text, record, index) => (
        record.transform_type === 'value_map' ? (
          <Input
            value={text}
            onChange={(e) => handleChange(index, 'transform_config', e)}
            placeholder='{"teacher":1,"admin":10}'
            style={{ width: 180 }}
          />
        ) : '-'
      ),
    },
    {
      title: 'Action',
      render: (text, record, index) => (
        <Popconfirm
          title="Delete this mapping?"
          onConfirm={() => handleDelete(index)}
        >
          <Button icon={<IconDelete />} type="danger" size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title={`Field Mappings - ${source?.name}`}
      visible={visible}
      onCancel={onCancel}
      style={{ width: 900 }}
      footer={
        <Space>
          <Button onClick={handleAdd} icon={<IconPlus />}>Add Mapping</Button>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={handleSave} loading={saving}>Save</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={mappings}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
      {mappings.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
          No mappings configured. Click "Add Mapping" to start.
        </div>
      )}
    </Modal>
  );
};

export default FieldMappingModal;
```

- [ ] **Step 2: Commit field mapping modal**

```bash
git add web/src/pages/ExternalUserSource/components/FieldMappingModal.jsx
git commit -m "feat: add field mapping modal component"
```

---

## Task 9: Frontend - Sync Log Modal

**Files:**
- Create: `web/src/pages/ExternalUserSource/components/SyncLogModal.jsx`

- [ ] **Step 1: Create sync log modal**

Create `web/src/pages/ExternalUserSource/components/SyncLogModal.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { Modal, Table, Tag, Typography } from '@douyinfe/semi-ui';
import { API } from '../../../helpers/api';

const { Text } = Typography;

const SyncLogModal = ({ visible, source, onCancel }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const loadLogs = async (p = 1) => {
    if (!source) return;
    setLoading(true);
    try {
      const res = await API.get(`/api/external-user-source/${source.id}/logs?page=${p}&page_size=${pageSize}`);
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
      setPage(p);
    } catch (err) {
      console.error('Failed to load logs');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      loadLogs(1);
    }
  }, [visible, source]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const columns = [
    {
      title: 'Time',
      dataIndex: 'started_at',
      render: (text, record) => (
        <div>
          <div>{formatTime(record.started_at)}</div>
          <Text type="secondary" size="small">
            Duration: {record.finished_at ? `${record.finished_at - record.started_at}s` : '-'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (text) => (
        <Tag color={text === 'success' ? 'green' : text === 'failed' ? 'red' : 'orange'}>
          {text.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Stats',
      render: (text, record) => (
        <div>
          <span style={{ marginRight: 8 }}>+{record.inserted}</span>
          <span style={{ marginRight: 8 }}>~{record.updated}</span>
          <span style={{ marginRight: 8 }}>x{record.disabled}</span>
          {record.errors > 0 && <span style={{ color: 'red' }}>!{record.errors}</span>}
        </div>
      ),
    },
    {
      title: 'Details',
      dataIndex: 'error_details',
      render: (text) => (
        <Text type="secondary" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {text || '-'}
        </Text>
      ),
    },
  ];

  return (
    <Modal
      title={`Sync Logs - ${source?.name}`}
      visible={visible}
      onCancel={onCancel}
      style={{ width: 900 }}
      footer={null}
    >
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{
          currentPage: page,
          pageSize: pageSize,
          total: total,
          onPageChange: (p) => loadLogs(p),
        }}
      />
    </Modal>
  );
};

export default SyncLogModal;
```

- [ ] **Step 2: Commit sync log modal**

```bash
git add web/src/pages/ExternalUserSource/components/SyncLogModal.jsx
git commit -m "feat: add sync log modal component"
```

---

## Task 10: Frontend Integration

**Files:**
- Modify: `web/src/App.jsx`
- Modify: `web/src/components/layout/SiderBar.jsx`
- Modify: `web/src/hooks/common/useSidebar.js`

- [ ] **Step 1: Add route to App.jsx**

Read `web/src/App.jsx` and find the route definitions. Add:

```jsx
import ExternalUserSource from './pages/ExternalUserSource';

// In routes array, add:
<Route path="/external-user-source" element={<AdminRoute><ExternalUserSource /></AdminRoute>} />
```

- [ ] **Step 2: Add menu item to SiderBar.jsx**

Read `web/src/components/layout/SiderBar.jsx` and find the admin menu items section. Add:

```jsx
import { IconLink } from '@douyinfe/semi-icons';

// In admin menu items array, add:
{
  itemKey: 'external-user-source',
  text: '外部用户源',
  icon: <IconLink />,
}
```

- [ ] **Step 3: Add to useSidebar.js**

Read `web/src/hooks/common/useSidebar.js` and find DEFAULT_ADMIN_CONFIG. Add:

```javascript
export const DEFAULT_ADMIN_CONFIG = {
  // ... existing items ...
  external_user_source: true,
};
```

- [ ] **Step 4: Commit frontend integration**

```bash
git add web/src/App.jsx
git add web/src/components/layout/SiderBar.jsx
git add web/src/hooks/common/useSidebar.js
git commit -m "feat: integrate external user source into frontend navigation"
```

---

## Task 11: i18n Translations

**Files:**
- Modify: `web/src/i18n/locales/zh.json`
- Modify: `web/src/i18n/locales/en.json`

- [ ] **Step 1: Add Chinese translations**

Read `web/src/i18n/locales/zh.json` and add:

```json
{
  "外部用户源": "外部用户源",
  "添加数据源": "添加数据源",
  "编辑数据源": "编辑数据源",
  "数据源名称": "数据源名称",
  "数据库类型": "数据库类型",
  "主机地址": "主机地址",
  "端口": "端口",
  "数据库名": "数据库名",
  "用户名": "用户名",
  "密码": "密码",
  "表名": "表名",
  "查询条件": "查询条件",
  "唯一键字段": "唯一键字段",
  "启用": "启用",
  "测试连接": "测试连接",
  "立即同步": "立即同步",
  "字段映射": "字段映射",
  "同步日志": "同步日志",
  "外部字段": "外部字段",
  "本地字段": "本地字段",
  "映射方式": "映射方式",
  "直接映射": "直接映射",
  "值映射": "值映射",
  "映射规则": "映射规则",
  "新增": "新增",
  "更新": "更新",
  "禁用": "禁用",
  "错误": "错误"
}
```

- [ ] **Step 2: Add English translations**

Read `web/src/i18n/locales/en.json` and add:

```json
{
  "外部用户源": "External User Sources",
  "添加数据源": "Add Source",
  "编辑数据源": "Edit Source",
  "数据源名称": "Source Name",
  "数据库类型": "Database Type",
  "主机地址": "Host",
  "端口": "Port",
  "数据库名": "Database",
  "用户名": "Username",
  "密码": "Password",
  "表名": "Table Name",
  "查询条件": "WHERE Clause",
  "唯一键字段": "Unique Key",
  "启用": "Enabled",
  "测试连接": "Test Connection",
  "立即同步": "Sync Now",
  "字段映射": "Field Mappings",
  "同步日志": "Sync Logs",
  "外部字段": "External Field",
  "本地字段": "Local Field",
  "映射方式": "Transform Type",
  "直接映射": "Direct",
  "值映射": "Value Map",
  "映射规则": "Transform Config",
  "新增": "Inserted",
  "更新": "Updated",
  "禁用": "Disabled",
  "错误": "Errors"
}
```

- [ ] **Step 3: Commit i18n translations**

```bash
git add web/src/i18n/locales/zh.json
git add web/src/i18n/locales/en.json
git commit -m "feat: add i18n translations for external user sync"
```

---

## Task 12: Final Build and Test

**Files:**
- None (testing and build)

- [ ] **Step 1: Build frontend**

```bash
cd web
bun run build
```

Expected: Build succeeds with no errors

- [ ] **Step 2: Run backend**

```bash
cd new-api
go build -o new-api
./new-api
```

Expected: Server starts, migrations run successfully

- [ ] **Step 3: Test database migration**

Open browser to http://localhost:3000, login as admin, navigate to External User Sources page. Verify:
- Table shows empty state
- Add Source button works
- Form modal opens

- [ ] **Step 4: Create a test source**

Create a test external source:
- Name: "Test MySQL"
- Type: MySQL
- Host: localhost (or any test DB)
- Port: 3306
- Database: test
- Username: root
- Password: test
- Table: users
- Unique Key: id

Click "Test Connection" - should show result (success or failure based on actual DB)

- [ ] **Step 5: Configure field mappings**

Click "Mapping" button:
- Add mapping: external_field="username", local_field="username", transform="direct"
- Add mapping: external_field="email", local_field="email", transform="direct"
- Add mapping: external_field="role", local_field="role", transform="value_map", config='{"admin":10,"user":1}'
- Save

- [ ] **Step 6: Test manual sync**

Click "Sync" button. Verify:
- Sync executes
- Result shows inserted/updated/disabled counts
- Sync log appears in log modal

- [ ] **Step 7: Commit final version**

```bash
git add .
git commit -m "feat: complete external user sync feature implementation"
git tag v1.0.0-external-user-sync
```

---

## Post-Implementation Notes

### Environment Variable Required

Set `AES_KEY` environment variable (32 bytes) before running:
```bash
export AES_KEY="your-32-byte-aes-key-here-12345"
```

### Cron Task Setup

After deployment:
1. Go to Task Settings page
2. Find "external_user_sync" task
3. Configure cron expression (default: every 6 hours)
4. Enable the task

### Database Users

Create read-only database users for external connections:
```sql
-- MySQL
CREATE USER 'readonly'@'%' IDENTIFIED BY 'password';
GRANT SELECT ON database.* TO 'readonly'@'%';

-- PostgreSQL
CREATE USER readonly WITH PASSWORD 'password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
```
