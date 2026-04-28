## Why

The system currently has hardcoded scheduled tasks (subscription reset, credential refresh) with fixed intervals and no administrative control. Administrators cannot adjust execution schedules, disable tasks temporarily, or view execution history. This limits operational flexibility and makes troubleshooting difficult when tasks fail.

A configurable cron task management framework will enable administrators to:
- Adjust task schedules via Web UI
- Enable/disable tasks without code changes
- View execution history and error logs
- Manually trigger tasks on demand
- Receive notifications when tasks fail

## What Changes

### Backend
- Add `cron_task` and `cron_task_execution` database tables
- Create task scheduling service using `robfig/cron` library
- Implement task executor interface and registry
- Add 11 built-in task executors (cleanup, stats, sync, notify categories)
- Add REST API endpoints for task management
- Integrate with existing notification system for failure alerts
- Migrate existing `subscription_reset_task` to new framework

### Frontend
- Add Cron Task Management page under Settings
- Add task list view with status, schedule, and actions
- Add task edit modal with simple/advanced schedule modes
- Add execution history page with filtering
- Add manual trigger and enable/disable actions

### Database Migration
- Create `cron_task` table (task configuration)
- Create `cron_task_execution` table (execution logs)
- Insert default built-in task records

## Capabilities

### New Capabilities
- `cron-task-management`: Administrative interface for viewing, configuring, and managing scheduled tasks
- `cron-task-execution`: Execution engine with distributed locking, retry logic, and logging
- `cron-task-notification`: Failure notification integration with existing notification system

### Modified Capabilities
- None (this is a new feature, no existing capabilities are modified)

## Impact

### Affected Code
- `model/` - New models for cron_task, cron_task_execution
- `service/cron/` - New scheduler, registry, executors
- `controller/` - New API endpoints
- `router/` - New routes
- `dto/notify.go` - Add NotifyTypeCronTaskFailed constant
- `web/src/pages/Setting/` - New Cron management page
- `main.go` - Initialize scheduler on startup

### Dependencies
- `robfig/cron` - New external dependency for cron scheduling

### APIs
- `GET /api/cron/tasks` - List tasks
- `GET /api/cron/tasks/:id` - Task details
- `PUT /api/cron/tasks/:id` - Update task
- `POST /api/cron/tasks/:id/enable` - Enable task
- `POST /api/cron/tasks/:id/disable` - Disable task
- `POST /api/cron/tasks/:id/run` - Manual execution
- `GET /api/cron/executions` - Execution history
- `GET /api/cron/executions/:id` - Execution details
- `GET /api/cron/executor/list` - Available executors

### Backward Compatibility
- Existing `subscription_reset_task` code preserved for compatibility
- Detection logic: if new framework has task enabled, use new framework; otherwise use legacy code
