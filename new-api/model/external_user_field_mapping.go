package model

type ExternalUserFieldMapping struct {
	Id              int    `json:"id" gorm:"primaryKey;autoIncrement"`
	SourceId        int    `json:"source_id" gorm:"index;not null;column:source_id"`
	ExternalField   string `json:"external_field" gorm:"not null;size:100;column:external_field"`
	LocalField      string `json:"local_field" gorm:"not null;size:50;column:local_field"`
	TransformType   string `json:"transform_type" gorm:"size:20;default:'direct';column:transform_type"`
	TransformConfig string `json:"transform_config" gorm:"type:text;column:transform_config"`
	DefaultValue    string `json:"default_value" gorm:"size:255;column:default_value"`
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
