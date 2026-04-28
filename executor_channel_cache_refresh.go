package cron

import (
	"context"
	"fmt"
	"github.com/QuantumNous/new-api/model"
)

type ChannelCacheRefreshExecutor struct{}
func init() { RegisterExecutor("channel_cache_refresh", &ChannelCacheRefreshExecutor{}) }
func (e *ChannelCacheRefreshExecutor) Execute(ctx context.Context) (string, error) {
	model.InitChannelCache()
	return "channel cache refreshed", nil
}
