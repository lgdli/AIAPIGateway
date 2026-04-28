## Context

The project has two ad-hoc scheduled tasks using time.Ticker: subscription reset and codex credential refresh. They provide no visibility, runtime configuration, or monitoring. The notification system (service/user_notify.go) supports email, webhook, bark, gotify via NotifyRootUser().

## Goals / Non-Goals

**Goals:**
- Centralized scheduled task management with database configuration
- Web UI for task monitoring and control
- Enable/disable, manual trigger, interval configuration
- Execution logs with 30-day retention
- Task failure notifications
- Distributed execution with database locking
- Migration path for existing tasks

**Non-Goals:**
- Custom task creation (built-in only)
- Task dependencies/workflow orchestration
- Real-time progress updates
- Retry policies beyond manual re-trigger

## Decisions

### D1: Use robfig/cron for scheduling
Rationale: Industry standard with cron expressions, timezone support, dynamic job management.
Alternatives: time.Ticker (no reconfig), gocron (larger), custom (reinventing).

### D2: Database-level distributed lock
Rationale: Use cron_task_execution records with status=running to prevent concurrent runs. Works across SQLite/MySQL/PostgreSQL.
Alternatives: Redis lock (requires Redis), IsMasterNode only (no failover).

### D3: Task registry with built-in executors
Registry pattern for clean separation of definition and execution.
Built-in: log_cleanup, token_cleanup, subscription_maintenance, codex_credential_refresh, channel_cache_refresh.

### D4: Migration strategy - dual-mode
New framework activates if cron_task table has enabled tasks. Old files remain for backward compatibility.

## Risks / Trade-offs

- Database lock contention → Each task has own scope; monitor with duration logging
- Missed executions during downtime → Tasks don't "miss", they fire at next interval
- 30-day log retention → Configurable in future if needed
- SQLite locking → Test thoroughly with concurrent executions
