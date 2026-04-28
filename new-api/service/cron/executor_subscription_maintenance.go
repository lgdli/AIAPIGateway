package cron

import (
	"context"
	"fmt"
	"github.com/QuantumNous/new-api/model"
)

type SubscriptionMaintenanceExecutor struct{}
func init() { RegisterExecutor("subscription_maintenance", &SubscriptionMaintenanceExecutor{}) }
func (e *SubscriptionMaintenanceExecutor) Execute(ctx context.Context) (string, error) {
	var expired, reset int
	for {
		n, err := model.ExpireDueSubscriptions(300)
		if err != nil { return "", err }
		if n == 0 { break }
		expired += n
		if n < 300 { break }
	}
	for {
		n, err := model.ResetDueSubscriptions(300)
		if err != nil { return "", err }
		if n == 0 { break }
		reset += n
		if n < 300 { break }
	}
	return fmt.Sprintf("expired %d, reset %d", expired, reset), nil
}
