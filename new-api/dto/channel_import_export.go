package dto

type ChannelExportRequest struct {
	Ids    []int  `json:"ids"`    // Empty or specific IDs to export
	All    bool   `json:"all"`    // Export all channels
	Format string `json:"format"` // "json" or "csv"
}

type ChannelExportResponse struct {
	Data       []ChannelExportItem `json:"data,omitempty"`
	Filename   string              `json:"filename,omitempty"`
	Content    string              `json:"content,omitempty"` // For page display
	TotalCount int                 `json:"total_count"`
	Warning    string              `json:"warning,omitempty"` // Key exposure warning
}

type ChannelExportItem struct {
	Id                 int     `json:"id"`
	Type               int     `json:"type"`
	Key                string  `json:"key"`
	Name               string  `json:"name"`
	Status             int     `json:"status"`
	Weight             *uint   `json:"weight"`
	BaseURL            *string `json:"base_url"`
	Models             string  `json:"models"`
	Group              string  `json:"group"`
	ModelMapping       *string `json:"model_mapping"`
	Priority           *int64  `json:"priority"`
	AutoBan            *int    `json:"auto_ban"`
	Tag                *string `json:"tag"`
	Setting            *string `json:"setting"`
	ParamOverride      *string `json:"param_override"`
	HeaderOverride     *string `json:"header_override"`
	TestModel          *string `json:"test_model"`
	StatusCodeMapping  *string `json:"status_code_mapping"`
	Other              string  `json:"other"`
	OtherSettings      string  `json:"settings"`
	OpenAIOrganization *string `json:"openai_organization,omitempty"`
	Remark             *string `json:"remark,omitempty"`
}

type ChannelImportRequest struct {
	DuplicateStrategy string `json:"duplicate_strategy"` // "skip", "update", "create_new"
	TestConnectivity  bool   `json:"test_connectivity"`
	Format            string `json:"format"` // "json" or "csv"
}

type ChannelImportResponse struct {
	Success      int                   `json:"success"`
	Skipped      int                   `json:"skipped"`
	Failed       int                   `json:"failed"`
	Updated      int                   `json:"updated"`
	TestFailed   int                   `json:"test_failed"`
	Details      []ChannelImportDetail `json:"details"`
	ErrorMessage string                `json:"error_message,omitempty"`
}

type ChannelImportDetail struct {
	Name        string `json:"name"`
	Status      string `json:"status"` // "success", "skipped", "failed", "updated"
	Message     string `json:"message,omitempty"`
	ChannelId   int    `json:"channel_id,omitempty"`
	TestSuccess *bool  `json:"test_success,omitempty"`
}

const (
	MaxExportCount = 1000
	MaxImportCount = 1000
)
