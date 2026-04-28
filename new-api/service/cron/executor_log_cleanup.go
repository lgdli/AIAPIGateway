package cron

import (
	"context"
	"fmt"
	"github.com/QuantumNous/new-api/model"
)
type LogCleanupExecutor struct{}
func init() { RegisterExecutor("log_cleanup", &LogCleanupExecutor{}) }
func (e *LogCleanupExecutor) Execute(ctx context.Context) (string, error) {
	var cleaned int64
	if n, err := model.CleanupSubscriptionPreConsumeRecords(7 * 24 * 3600); err == nil { cleaned += n }
	if n, err := model.CleanupOldCronTaskExecutions(30); err == nil { cleaned += n }
	return fmt.Sprintf("cleaned %d records", cleaned), nil
}
