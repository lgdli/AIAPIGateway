package cron

import (
	"context"
	"fmt"
	"strings"

	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
)

type ExternalUserSyncExecutor struct{}

func (e *ExternalUserSyncExecutor) Execute(ctx context.Context) (string, error) {
	sources, err := model.GetEnabledExternalUserSources()
	if err != nil {
		return "", fmt.Errorf("failed to get enabled sources: %v", err)
	}

	if len(sources) == 0 {
		return "No enabled external user sources", nil
	}

	var results []string
	for _, source := range sources {
		log, err := service.SyncUsers(source)
		if err != nil {
			results = append(results, fmt.Sprintf("%s: Failed - %s", source.Name, err.Error()))
		} else {
			results = append(results, fmt.Sprintf("%s: +%d ~%d x%d",
				source.Name, log.Inserted, log.Updated, log.Disabled))
		}
	}

	return strings.Join(results, "; "), nil
}

func init() {
	RegisterExecutor("external_user_sync", &ExternalUserSyncExecutor{})
}
