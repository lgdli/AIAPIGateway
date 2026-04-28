## 1. Database Models

- [x] 1.1 Create model/cron_task.go with CronTask struct
- [x] 1.2 Create model/cron_task_execution.go with CronTaskExecution struct
- [x] 1.3 Add database migration for cron_task table
- [x] 1.4 Add database migration for cron_task_execution table
- [x] 1.5 Add GORM methods for task CRUD operations

## 2. Task Executor Framework

- [x] 2.1 Create service/cron/registry.go with executor registry
- [x] 2.2 Create service/cron/executor.go with Executor interface
- [x] 2.3 Create service/cron/executor_log_cleanup.go
- [x] 2.4 Create service/cron/executor_token_cleanup.go
- [x] 2.5 Create service/cron/executor_subscription_maintenance.go
- [x] 2.6 Create service/cron/executor_codex_credential_refresh.go
- [x] 2.7 Create service/cron/executor_channel_cache_refresh.go

## 3. Scheduler Service

- [x] 3.1 Add robfig/cron dependency to go.mod
- [x] 3.2 Create service/cron/scheduler.go with Scheduler struct
- [x] 3.3 Implement StartScheduler function
- [x] 3.4 Implement StopScheduler function
- [x] 3.5 Implement AddTask function
- [x] 3.6 Implement RemoveTask function
- [x] 3.7 Implement UpdateTask function
- [x] 3.8 Implement task execution wrapper

## 4. Notification Integration

- [x] 4.1 Add NotifyTypeCronTaskFailed constant
- [x] 4.2 Add NotifyCronTaskFailure function
- [x] 4.3 Call notification on task failure

## 5. REST API

- [x] 5.1 Create controller/cron_task.go
- [x] 5.2 Create dto/cron_task.go (using inline structs in controller)
- [x] 5.3 Add routes to router
- [x] 5.4 Add admin role middleware

## 6. Frontend Web UI

- [x] 6.1 Create TaskSetting page
- [x] 6.2 Create TaskTable component (integrated in index.jsx)
- [x] 6.3 Create TaskEditModal component
- [x] 6.4 Create ExecutionHistoryModal component
- [x] 6.5 Add API functions (web/src/services/api.js)
- [x] 6.6 Add route to App.jsx
- [x] 6.7 Add sidebar menu item (in model/user.go)
- [ ] 6.8 Add i18n translations (deferred - can be done later)

## 7. Initialization

- [x] 7.1 Create default tasks init function (in model/cron_task.go)
- [x] 7.2 Start scheduler on app startup (in main.go)
- [x] 7.3 Insert default tasks if empty
- [x] 7.4 Update sidebar config (in model/user.go)

## 8. Testing

- [ ] 8.1 Test enable/disable via UI
- [ ] 8.2 Test manual trigger
- [ ] 8.3 Test cron expression update
- [ ] 8.4 Test execution history
- [ ] 8.5 Test distributed lock
- [ ] 8.6 Test failure notification
- [ ] 8.7 Test log retention

**Status: 39/46 tasks complete (85%)**
