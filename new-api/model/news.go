package model

import (
	"time"
)

type News struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title" gorm:"size:200;not null"`
	Summary     string    `json:"summary" gorm:"size:500"`
	Content     string    `json:"content" gorm:"type:text"`
	Image       string    `json:"image" gorm:"size:500"`
	Category    string    `json:"category" gorm:"size:50;not null;default:'system'"`
	Pinned      bool      `json:"pinned" gorm:"default:false"`
	Status      int       `json:"status" gorm:"default:0"`
	PublishDate time.Time `json:"publish_date"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func GetNewsList(category string, limit, offset int) ([]News, int64, error) {
	var news []News
	var total int64
	query := DB.Model(&News{}).Where("status = ?", 1)
	if category != "" {
		query = query.Where("category = ?", category)
	}
	query.Count(&total)
	err := query.Order("pinned DESC, publish_date DESC").Limit(limit).Offset(offset).Find(&news).Error
	return news, total, err
}

func GetNewsById(id uint) (*News, error) {
	var news News
	err := DB.First(&news, id).Error
	if err != nil {
		return nil, err
	}
	return &news, nil
}

func GetNewsManageList(page, pageSize int) ([]News, int64, error) {
	var news []News
	var total int64
	offset := (page - 1) * pageSize
	DB.Model(&News{}).Count(&total)
	err := DB.Order("created_at DESC").Limit(pageSize).Offset(offset).Find(&news).Error
	return news, total, err
}

func CreateNews(news *News) error {
	news.CreatedAt = time.Now()
	news.UpdatedAt = time.Now()
	if news.Status == 1 {
		news.PublishDate = time.Now()
	}
	return DB.Create(news).Error
}

func UpdateNews(news *News) error {
	var existing News
	if err := DB.First(&existing, news.ID).Error; err != nil {
		return err
	}
	news.UpdatedAt = time.Now()
	if existing.Status == 1 && news.Status == 1 {
		news.PublishDate = existing.PublishDate
	} else if news.Status == 1 && existing.Status == 0 {
		news.PublishDate = time.Now()
	}
	return DB.Model(&existing).Updates(map[string]interface{}{
		"title":        news.Title,
		"summary":      news.Summary,
		"content":      news.Content,
		"image":        news.Image,
		"category":     news.Category,
		"pinned":       news.Pinned,
		"status":       news.Status,
		"publish_date": news.PublishDate,
		"updated_at":   news.UpdatedAt,
	}).Error
}

func DeleteNewsById(id uint) error {
	return DB.Delete(&News{}, id).Error
}
