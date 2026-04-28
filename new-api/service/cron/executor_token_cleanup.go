package cron

import (
	"context"
	"fmt"
	"time"
	"github.com/QuantumNous/new-api/model"
)

type TokenCleanupExecutor struct{}
func init() { RegisterExecutor("token_cleanup", &TokenCleanupExecutor{}) }
func (e *TokenCleanupExecutor) Execute(ctx context.Context) (string, error) {
	result := model.DB.Where("expired_time < ?", time.Now().Unix()).Delete(&model.Token{})
	if result.Error != nil { return "", result.Error }
	return fmt.Sprintf("cleaned %d expired tokens", result.RowsAffected), nil
}
