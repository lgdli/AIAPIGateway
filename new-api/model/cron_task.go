package model

import (
	"github.com/QuantumNous/new-api/common"
)

type CronTask struct {
	Id             int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name           string `json:"name" gorm:"type:varchar(64);uniqueIndex;not null"`
	DisplayName    string `json:"display_name" gorm:"type:varchar(128);not null"`
	Description    string `json:"description" gorm:"type:varchar(256)"`
	CronExpression string `json:"cron_expression" gorm:"type:varchar(64);not null"`
	Enabled        bool   `json:"enabled" gorm:"default:false"`
	TimeoutSeconds int    `json:"timeout_seconds" gorm:"default:300"`
	CreatedAt      int64  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt      int64  `json:"updated_at" gorm:"autoUpdateTime"`
}

func (CronTask) TableName() string {
	return "cron_task"
}

func GetAllCronTasks() ([]*CronTask, error) {
	var tasks []*CronTask
	err := DB.Order("id asc").Find(&tasks).Error
	return tasks, err
}

func GetCronTaskByID(id int) (*CronTask, error) {
	var task CronTask
	err := DB.Where("id = ?", id).First(&task).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

func GetCronTaskByName(name string) (*CronTask, error) {
	var task CronTask
	err := DB.Where("name = ?", name).First(&task).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

func (t *CronTask) Insert() error {
	return DB.Create(t).Error
}

func (t *CronTask) Update() error {
	return DB.Save(t).Error
}

func UpdateCronTask(id int, updates map[string]interface{}) error {
	return DB.Model(&CronTask{}).Where("id = ?", id).Updates(updates).Error
}

func GetEnabledCronTasks() ([]*CronTask, error) {
	var tasks []*CronTask
	err := DB.Where("enabled = ?", true).Order("id asc").Find(&tasks).Error
	return tasks, err
}

func InsertDefaultCronTasks() error {
	defaultTasks := []*CronTask{
		{
			Name:           "log_cleanup",
			DisplayName:    "Log Cleanup",
			Description:    "Clean up old log records and execution history",
			CronExpression: "0 3 * * *",
			Enabled:        false,
			TimeoutSeconds: 300,
		},
		{
			Name:           "token_cleanup",
			DisplayName:    "Token Cleanup",
			Description:    "Clean up expired tokens",
			CronExpression: "0 4 * * *",
			Enabled:        false,
			TimeoutSeconds: 300,
		},
		{
			Name:           "subscription_maintenance",
			DisplayName:    "Subscription Maintenance",
			Description:    "Reset and expire subscriptions",
			CronExpression: "*/1 * * * *",
			Enabled:        false,
			TimeoutSeconds: 300,
		},
		{
			Name:           "codex_credential_refresh",
			DisplayName:    "Codex Credential Refresh",
			Description:    "Refresh Codex channel credentials",
			CronExpression: "*/10 * * * *",
			Enabled:        false,
			TimeoutSeconds: 300,
		},
		{
			Name:           "channel_cache_refresh",
			DisplayName:    "Channel Cache Refresh",
			Description:    "Rebuild channel cache",
			CronExpression: "0 */6 * * *",
			Enabled:        false,
			TimeoutSeconds: 60,
		},
		{
			Name:           "external_user_sync",
			DisplayName:    "External User Sync",
			Description:    "Sync users from external user sources",
			CronExpression: "0 */6 * * *",
			Enabled:        false,
			TimeoutSeconds: 600,
		},
	}

	for _, task := range defaultTasks {
		var existing CronTask
		err := DB.Where("name = ?", task.Name).First(&existing).Error
		if err == nil {
			continue
		}
		if err := task.Insert(); err != nil {
			common.SysLog("failed to insert default cron task: " + task.Name + ", error: " + err.Error())
		}
	}
	return nil
}
