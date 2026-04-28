package cron

import (
	"context"
	"fmt"
	"sync"
	"time"
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/robfig/cron/v3"
)

var (
	scheduler     *cron.Cron
	schedulerOnce sync.Once
	entryMap      = make(map[int]cron.EntryID)
	entryMutex    sync.RWMutex
)

func StartScheduler() {
	schedulerOnce.Do(func() {
		scheduler = cron.New(cron.WithSeconds())
		tasks, err := model.GetEnabledCronTasks()
		if err != nil {
			common.SysLog("failed to load cron tasks: " + err.Error())
			return
		}
		for _, task := range tasks {
			AddTask(task)
		}
		scheduler.Start()
		common.SysLog("cron scheduler started")
	})
}

func StopScheduler() {
	if scheduler != nil {
		scheduler.Stop()
		common.SysLog("cron scheduler stopped")
	}
}

func AddTask(task *model.CronTask) error {
	executor, err := GetExecutor(task.Name)
	if err != nil {
		return err
	}
	entryId, err := scheduler.AddFunc(task.CronExpression, func() {
		executeTask(task, executor, "scheduler")
	})
	if err != nil {
		return err
	}
	entryMutex.Lock()
	entryMap[task.Id] = entryId
	entryMutex.Unlock()
	logger.LogInfo(context.Background(), fmt.Sprintf("added cron task: %s, cron: %s", task.Name, task.CronExpression))
	return nil
}

func RemoveTask(taskId int) {
	entryMutex.Lock()
	entryId, ok := entryMap[taskId]
	if ok {
		scheduler.Remove(entryId)
		delete(entryMap, taskId)
	}
	entryMutex.Unlock()
}

func UpdateTask(task *model.CronTask) error {
	RemoveTask(task.Id)
	if task.Enabled {
		return AddTask(task)
	}
	return nil
}

func TriggerTask(taskId int) error {
	task, err := model.GetCronTaskByID(taskId)
	if err != nil {
		return err
	}
	executor, err := GetExecutor(task.Name)
	if err != nil {
		return err
	}
	go executeTask(task, executor, "manual")
	return nil
}

func executeTask(task *model.CronTask, executor Executor, triggeredBy string) {
	ctx := context.Background()
	execution := &model.CronTaskExecution{
		TaskId:      task.Id,
		Status:      model.CronTaskExecutionStatusRunning,
		StartedAt:   time.Now().Unix(),
		TriggeredBy: triggeredBy,
	}
	model.CreateCronTaskExecution(execution)

	running, _ := model.GetRunningCronTaskExecution(task.Id)
	if running != nil && running.Id != execution.Id {
		model.UpdateCronTaskExecution(execution.Id, map[string]interface{}{
			"status":        model.CronTaskExecutionStatusFailed,
			"finished_at":   time.Now().Unix(),
			"result_message": "concurrent execution skipped",
		})
		return
	}

	timeout := time.Duration(task.TimeoutSeconds) * time.Second
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	done := make(chan struct{})
	var result string
	var execErr error
	go func() {
		result, execErr = executor.Execute(ctx)
		close(done)
	}()

	select {
	case <-done:
		status := model.CronTaskExecutionStatusSuccess
		if execErr != nil {
			status = model.CronTaskExecutionStatusFailed
			service.NotifyCronTaskFailure(task.DisplayName, execErr.Error())
		}
		finishedAt := time.Now().Unix()
		model.UpdateCronTaskExecution(execution.Id, map[string]interface{}{
			"status":        status,
			"finished_at":   finishedAt,
			"duration_ms":   (finishedAt - execution.StartedAt) * 1000,
			"result_message": result,
			"error_details":  fmt.Sprintf("%v", execErr),
		})
	case <-ctx.Done():
		model.UpdateCronTaskExecution(execution.Id, map[string]interface{}{
			"status":        model.CronTaskExecutionStatusFailed,
			"finished_at":   time.Now().Unix(),
			"result_message": "execution timeout",
		})
		service.NotifyCronTaskFailure(task.DisplayName, "execution timeout")
	}
}
