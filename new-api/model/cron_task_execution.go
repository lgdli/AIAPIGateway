package model

import (
	"time"
)

type CronTaskExecutionStatus string

const (
	CronTaskExecutionStatusRunning CronTaskExecutionStatus = "running"
	CronTaskExecutionStatusSuccess  CronTaskExecutionStatus = "success"
	CronTaskExecutionStatusFailed   CronTaskExecutionStatus = "failed"
)

type CronTaskExecution struct {
	Id            int64                   `json:"id" gorm:"primaryKey;autoIncrement"`
	TaskId        int                     `json:"task_id" gorm:"index;not null"`
	Status        CronTaskExecutionStatus `json:"status" gorm:"type:varchar(20);index;not null"`
	StartedAt     int64                   `json:"started_at" gorm:"index"`
	FinishedAt    int64                   `json:"finished_at"`
	DurationMs    int64                   `json:"duration_ms"`
	ResultMessage string                  `json:"result_message" gorm:"type:text"`
	ErrorDetails  string                  `json:"error_details" gorm:"type:text"`
	TriggeredBy   string                  `json:"triggered_by" gorm:"type:varchar(20)"` // "scheduler" or "manual"
	CreatedAt     int64                   `json:"created_at" gorm:"autoCreateTime;index"`
}

func (CronTaskExecution) TableName() string {
	return "cron_task_execution"
}

func CreateCronTaskExecution(execution *CronTaskExecution) error {
	return DB.Create(execution).Error
}

func UpdateCronTaskExecution(id int64, updates map[string]interface{}) error {
	return DB.Model(&CronTaskExecution{}).Where("id = ?", id).Updates(updates).Error
}

func GetCronTaskExecutionByID(id int64) (*CronTaskExecution, error) {
	var execution CronTaskExecution
	err := DB.Where("id = ?", id).First(&execution).Error
	if err != nil {
		return nil, err
	}
	return &execution, nil
}

func GetCronTaskExecutions(taskId int, offset int, limit int, status string) ([]*CronTaskExecution, int64, error) {
	var executions []*CronTaskExecution
	var total int64

	query := DB.Model(&CronTaskExecution{}).Where("task_id = ?", taskId)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = query.Order("id desc").Offset(offset).Limit(limit).Find(&executions).Error
	return executions, total, err
}

func GetLastCronTaskExecution(taskId int) (*CronTaskExecution, error) {
	var execution CronTaskExecution
	err := DB.Where("task_id = ?", taskId).Order("id desc").First(&execution).Error
	if err != nil {
		return nil, err
	}
	return &execution, nil
}

func GetRunningCronTaskExecution(taskId int) (*CronTaskExecution, error) {
	var execution CronTaskExecution
	err := DB.Where("task_id = ? AND status = ?", taskId, CronTaskExecutionStatusRunning).First(&execution).Error
	if err != nil {
		return nil, err
	}
	return &execution, nil
}

func CleanupOldCronTaskExecutions(retentionDays int) (int64, error) {
	cutoff := time.Now().AddDate(0, 0, -retentionDays).Unix()
	result := DB.Where("created_at < ?", cutoff).Delete(&CronTaskExecution{})
	return result.RowsAffected, result.Error
}
