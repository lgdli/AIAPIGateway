package cron

import (
	"fmt"
	"sync"
)

var (
	executorRegistry = make(map[string]Executor)
	registryMutex     sync.RWMutex
)

func RegisterExecutor(name string, executor Executor) {
	registryMutex.Lock()
	defer registryMutex.Unlock()
	executorRegistry[name] = executor
}

func GetExecutor(name string) (Executor, error) {
	registryMutex.RLock()
	defer registryMutex.RUnlock()
	executor, ok := executorRegistry[name]
	if !ok {
		return nil, fmt.Errorf("unknown executor: %s", name)
	}
	return executor, nil
}

func GetAllExecutorNames() []string {
	registryMutex.RLock()
	defer registryMutex.RUnlock()
	names := make([]string, 0, len(executorRegistry))
	for name := range executorRegistry {
		names = append(names, name)
	}
	return names
}
