## Why

The current project lacks a unified scheduled task management framework. Existing tasks (subscription reset, credential refresh) use ad-hoc implementations with time.Ticker, providing no visibility, configuration, or operational control. This creates operational risk and makes it impossible for administrators to monitor, configure, or troubleshoot scheduled tasks.

## What Changes

- Add a centralized scheduled task framework using robfig/cron
- Add database models for task definitions and execution logs
- Add REST API endpoints for task management (list, enable/disable, configure, trigger, view logs)
- Add Web UI for task management in admin panel
- Add built-in task executors (log cleanup, token cleanup, subscription reset, credential refresh)
- Add task failure notifications via existing notification system
- Migrate existing ad-hoc tasks to the new framework

## Capabilities

### New Capabilities
- `scheduled-tasks`: Task scheduling, execution, monitoring, and management framework
- `task-executors`: Built-in task implementations (log cleanup, token cleanup, etc.)
- `task-notifications`: Task failure notifications integrated with existing notification system

### Modified Capabilities
- (none - this is a new feature)

## Impact

- New database tables: `cron_task`, `cron_task_execution`
- New backend files: `model/cron_task.go`, `model/cron_task_execution.go`, `service/cron/*.go`, `controller/cron_task.go`
- New frontend: Task management page in admin panel
- Existing files to migrate: `service/subscription_reset_task.go`, `service/codex_credential_refresh_task.go`
- Dependencies: `github.com/robfig/cron/v3` (needs to be added)
