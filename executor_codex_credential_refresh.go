package cron

import (
	"context"
	"fmt"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
)

type CodexCredentialRefreshExecutor struct{}
func init() { RegisterExecutor("codex_credential_refresh", &CodexCredentialRefreshExecutor{}) }
func (e *CodexCredentialRefreshExecutor) Execute(ctx context.Context) (string, error) {
	refreshed := service.RunCodexCredentialAutoRefreshOnce()
	return fmt.Sprintf("refreshed %d credentials", refreshed), nil
}
