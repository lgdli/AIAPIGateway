package model

import (
	"time"
)

type ExternalUserSyncLog struct {
	Id           int    `json:"id" gorm:"primaryKey;autoIncrement"`
	SourceId     int    `json:"source_id" gorm:"index;not null;column:source_id"`
	Status       string `json:"status" gorm:"size:20"`
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
