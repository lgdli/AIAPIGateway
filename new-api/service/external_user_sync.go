package service

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
)

func ConnectExternalDB(source *model.ExternalUserSource) (*sql.DB, error) {
	common.SysLog(fmt.Sprintf("[ExternalDB] Source ID: %d, Password field length: %d, Password value: '%s'", source.Id, len(source.Password), source.Password))
	
	password, err := DecryptPassword(source.Password)
	if err != nil {
		common.SysLog(fmt.Sprintf("[ExternalDB] Decrypt failed: %v", err))
		return nil, fmt.Errorf("failed to decrypt password: %v", err)
	}
	
	common.SysLog(fmt.Sprintf("[ExternalDB] Decrypted password length: %d, value: '%s'", len(password), password))

	var dsn string
	var driver string

	switch source.DbType {
	case "mysql":
		driver = "mysql"
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=true",
			source.Username, password, source.Host, source.Port, source.Database)
		common.SysLog(fmt.Sprintf("[ExternalDB] MySQL DSN: %s", dsn))
	case "postgresql":
		driver = "postgres"
		dsn = fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
			source.Host, source.Port, source.Username, password, source.Database)
		common.SysLog(fmt.Sprintf("[ExternalDB] PostgreSQL DSN: %s", dsn))
	default:
		return nil, fmt.Errorf("unsupported database type: %s", source.DbType)
	}

	db, err := sql.Open(driver, dsn)
	if err != nil {
		common.SysLog(fmt.Sprintf("[ExternalDB] sql.Open failed: %v", err))
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		common.SysLog(fmt.Sprintf("[ExternalDB] Ping failed: %v", err))
		return nil, err
	}

	common.SysLog("[ExternalDB] Connection successful")
	return db, nil
}

func MaskConnectionString(connStr string) string {
	return regexp.MustCompile(`password=[^@\s]+`).ReplaceAllString(connStr, "password=***")
}

func FetchExternalUsers(db *sql.DB, source *model.ExternalUserSource, mappings []*model.ExternalUserFieldMapping) ([]map[string]interface{}, error) {
	var externalFields []string
	fieldSet := make(map[string]bool)
	
	// 收集外部字段，过滤空字段和重复字段
	for _, m := range mappings {
		if m.ExternalField != "" && !fieldSet[m.ExternalField] {
			externalFields = append(externalFields, m.ExternalField)
			fieldSet[m.ExternalField] = true
		}
	}
	
	// 添加UniqueKey（如果还没有）
	if !fieldSet[source.UniqueKey] {
		externalFields = append(externalFields, source.UniqueKey)
	}

	var quotedFields []string
	quoteChar := "`"
	if source.DbType == "postgresql" {
		quoteChar = `"`
	}
	for _, f := range externalFields {
		quotedFields = append(quotedFields, quoteChar+f+quoteChar)
	}

	query := fmt.Sprintf("SELECT %s FROM %s", strings.Join(quotedFields, ", "), source.TargetTable)
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
		Role:   1,
		Status: 1,
		Group:  "default",
		Quota:  0,
	}

	for _, m := range mappings {
		extValue := extUser[m.ExternalField]
		
		// 如果外部字段值为空或不存在，使用默认值
		common.SysLog(fmt.Sprintf("[TransformUser] Field: %s, ExternalField: %s, ExtValue: %v, DefaultValue: '%s'", m.LocalField, m.ExternalField, extValue, m.DefaultValue))
		if extValue == nil || fmt.Sprint(extValue) == "" {
			if m.DefaultValue != "" {
				common.SysLog(fmt.Sprintf("[TransformUser] Using default value for %s: %s", m.LocalField, m.DefaultValue))
				setUserField(user, m.LocalField, m.DefaultValue)
			}
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
				case "quota":
					if val, ok := mappedValue.(float64); ok {
						user.Quota = int(val)
					} else if val, ok := mappedValue.(int); ok {
						user.Quota = val
					}
				}
			} else {
				// 映射不到时，使用默认值或系统默认值
				if m.DefaultValue != "" {
					setUserField(user, m.LocalField, m.DefaultValue)
				} else {
					if m.LocalField == "role" {
						user.Role = 1
					} else if m.LocalField == "status" {
						user.Status = 1
					}
				}
			}
		} else if m.TransformType == "compute" {
			// 计算类型：支持表达式计算
			// Config格式：表达式，如 "${emp_id}_${dept}" 或 "prefix_${emp_id}"
			result := computeValue(m.TransformConfig, extUser)
			setUserField(user, m.LocalField, result)
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
	case "group":
		user.Group = value
	case "role":
		if val, err := strconv.Atoi(value); err == nil {
			user.Role = val
		}
	case "status":
		if val, err := strconv.Atoi(value); err == nil {
			user.Status = val
		}
	case "quota":
		if val, err := strconv.Atoi(value); err == nil {
			user.Quota = val
		}
	}
}

func computeValue(template string, extUser map[string]interface{}) string {
	// 匹配 ${field_name} 模式
	re := regexp.MustCompile(`\$\{([^}]+)\}`)
	
	result := template
	matches := re.FindAllStringSubmatch(template, -1)
	
	for _, match := range matches {
		placeholder := match[0]  // ${field_name}
		fieldName := match[1]    // field_name
		
		if value, ok := extUser[fieldName]; ok {
			result = strings.ReplaceAll(result, placeholder, fmt.Sprint(value))
		} else {
			// 字段不存在，替换为空字符串
			result = strings.ReplaceAll(result, placeholder, "")
		}
	}
	
	return result
}

func SyncUsers(source *model.ExternalUserSource) (*model.ExternalUserSyncLog, error) {
	log := model.CreateSyncLog(source.Id)

	db, err := ConnectExternalDB(source)
	if err != nil {
		log.Status = "failed"
		log.ErrorDetails = "Connection failed: " + err.Error()
		log.Save()
		return log, err
	}
	defer db.Close()

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

	externalUsers, err := FetchExternalUsers(db, source, mappings)
	if err != nil {
		log.Status = "failed"
		log.ErrorDetails = "Query failed: " + err.Error()
		log.Save()
		return log, err
	}

	externalUsernames := []string{}
	for _, extUser := range externalUsers {
		username := fmt.Sprint(extUser[source.UniqueKey])
		if username == "" {
			log.Errors++
			continue
		}
		externalUsernames = append(externalUsernames, username)

		localUser, err := model.GetUserByUsername(username)
		if err == nil && localUser != nil {
			if localUser.Password != "" {
				common.SysLog(fmt.Sprintf("Skipping user %s: non-OAuth user", username))
				continue
			}
			UpdateUserFromExternal(localUser, extUser, mappings)
			log.Updated++
		} else {
			user := TransformUser(extUser, mappings)
			user.Username = username
			user.Password = ""
			if err := user.Insert(-1); err != nil {
				common.SysLog(fmt.Sprintf("Failed to create user %s: %v", username, err))
				log.Errors++
			} else {
				log.Inserted++
			}
		}
	}

	disabledCount, err := DisableOrphanUsers(source.Id, externalUsernames)
	if err != nil {
		common.SysLog(fmt.Sprintf("Failed to disable orphan users: %v", err))
	} else {
		log.Disabled = disabledCount
	}

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
		Update("status", 2)

	return int(result.RowsAffected), result.Error
}
