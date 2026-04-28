package cron

import "context"

type Executor interface {
	Execute(ctx context.Context) (string, error)
}

type ExecutorResult struct {
	Message string
	Error   error
}
