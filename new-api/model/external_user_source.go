package model

import (
	"time"
)

type ExternalUserSource struct {
	Id           int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name         string `json:"name" gorm:"unique;not null;size:100"`
	OAuthProviderId  int    `json:"oauth_provider_id" gorm:"type:int;default:0;column:oauth_provider_id"` // OAuth provider to bind for users without password
	DbType       string `json:"db_type" gorm:"not null;size:20"`
	Host         string `json:"host" gorm:"not null;size:255"`
	Port         int    `json:"port" gorm:"not null"`
	Database     string `json:"database" gorm:"not null;size:100"`
	Username     string `json:"username" gorm:"not null;size:100"`
	Password     string `json:"password" gorm:"not null;size:255"`
	TargetTable  string `json:"table_name" gorm:"not null;size:100;column:table_name"`
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
