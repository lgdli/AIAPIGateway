## Context

The system currently has two hardcoded scheduled tasks:
- `service/subscription_reset_task.go` - Resets subscription quotas every minute
- `service/codex_credential_refresh_task.go` - Refreshes Codex OAuth credentials

Both use `time.Ticker` with fixed intervals, started in `main.go`, and only run on the master node (`IsMasterNode` check).

### Current Architecture
```
main.go
  ├─ service.StartSubscriptionQuotaResetTask()
  │    └─ time.Ticker (1 min) → batch processing
  └─ service.StartCodexCredentialAutoRefreshTask()
       └─ time.Ticker (configurable) → credential refresh
```

### Constraints
- Must support SQLite, MySQL, PostgreSQL (per AGENTS.md)
- Must use `common.Marshal`/`common.Unmarshal` for JSON (per AGENTS.md Rule 1)
- Only master node executes tasks (existing pattern with `IsMasterNode`)
- Must integrate with existing notification system (`service.NotifyRootUser`)
- No custom user-defined tasks (fixed set of built-in executors)

## Goals / Non-Goals

**Goals:**
- Administrators can view all scheduled tasks in Web UI
- Administrators can enable/disable tasks
- Administrators can modify task schedules (Cron expressions)
- Administrators can manually trigger tasks
- Execution history is logged and viewable (30-day retention)
- Failed tasks trigger notifications via existing notification system
- Failed tasks retry with exponential backoff

**Non-Goals:**
- Custom user-defined tasks (not supported)
- Task dependencies (A depends on B)
- Task progress tracking within long-running tasks
- Distributed task queue (using only master node)
- Custom task types beyond built-in executors

## Decisions

### 1. Scheduling Engine: robfig/cron

**Decision:** Use `robfig/cron` v3 library

**Rationale:**
- Mature, widely used (20k+ GitHub stars)
- Standard 5-field Cron expression support
- Compatible with existing `time.Ticker` patterns
- No extra complexity for our use case

**Alternatives considered:**
- `go-co-op/gocron` - Friendlier API, but overkill for fixed task set
- Custom `time.Ticker` + DB polling - More code, reinvents wheel

### 2. Distributed Locking: Database Row Lock

**Decision:** Use database row-level locking via `locked_by` and `locked_at` columns

**Implementation:**
```sql
UPDATE cron_task 
SET locked_by = 'node-id', locked_at = NOW()
WHERE id = ? AND locked_at IS NULL AND status = 1
```

**Rationale:**
- No additional infrastructure (Redis not required)
- Works across all supported databases
- Simple and reliable for single-master deployments

**Alternatives considered:**
- Redis Redlock - Requires Redis deployment, overkill
- `IsMasterNode` only - Doesn't handle failover scenarios

### 3. Task Registration: Go Code Registry

**Decision:** Built-in executors registered in Go code at startup

**Rationale:**
- No custom tasks means no need for plugin system
- Type-safe configuration validation
- Simpler than database-driven executor discovery

**Registry pattern:**
```go
type TaskExecutor interface {
    Name() string
    Description() string
    Category() string
    Execute(ctx context.Context, config json.RawMessage) (interface{}, error)
    ValidateConfig(config json.RawMessage) error
    DefaultConfig() json.RawMessage
}

var registry = map[string]TaskExecutor{}

func Register(e TaskExecutor) {
    registry[e.Name()] = e
}
```

### 4. Execution Log Retention: Built-in Cleanup Task

**Decision:** Add `execution_log_cleanup` as a built-in task (runs daily at 6 AM)

**Rationale:**
- Self-maintaining system
- Configurable retention period (default 30 days)
- Consistent with other cleanup tasks

### 5. Failure Notification: NotifyRootUser

**Decision:** Use existing `service.NotifyRootUser()` when task fails after max retries

**Implementation:**
```go
service.NotifyRootUser(
    "cron_task_failed",
    "定时任务执行失败",
    fmt.Sprintf("任务 [%s] 执行失败\n错误: %s", task.Name, err.Error()),
)
```

**Rationale:**
- Reuses existing notification infrastructure
- Supports Email, Webhook, Bark, Gotify
- No new configuration needed

### 6. Backward Compatibility: Detection-based Migration

**Decision:** Keep old task code, detect which framework to use at startup

**Logic:**
```go
if cron.IsTaskEnabled("subscription_reset") {
    // New framework handles it
} else {
    // Legacy code (existing subscription_reset_task.go)
    service.StartSubscriptionQuotaResetTask()
}
```

**Rationale:**
- Zero-downtime migration
- Easy rollback if issues arise
- Gradual adoption possible

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Long-running tasks block scheduler | Executors must handle timeouts; default 30-min timeout |
| Task execution overlap | Database lock prevents concurrent execution; `skip_if_running` config |
| Master node failure | Tasks stop; database lock prevents slave conflicts; manual failover |
| SQLite concurrency | Keep-alive query every minute; batch processing reduces writes |
| Cron expression errors | Validate on save; UI provides simple mode alternative |
| Execution log bloat | Built-in cleanup task (30-day retention) |

## Migration Plan

### Phase 1: Add Framework (No Disruption)
1. Add `cron_task` and `cron_task_execution` tables
2. Implement scheduler, registry, executors
3. Add Web UI pages
4. Insert default task records (all disabled initially)
5. Deploy - old tasks still running

### Phase 2: Migrate Subscription Reset
1. Enable `subscription_reset` task in new framework
2. Verify execution logs show correct behavior
3. Monitor for 24-48 hours
4. If successful, legacy code becomes dormant (no manual removal needed)

### Phase 3: Migrate Codex Credential Refresh
1. Enable `codex_credential_refresh` task
2. Verify OAuth flows still work
3. Monitor for 24-48 hours

### Rollback Strategy
- Disable new task → legacy code automatically takes over
- No data migration needed (tables are independent)
- UI can be hidden via feature flag if needed

## Open Questions

1. **Task timeout default:** 30 minutes? Should this be per-task configurable?
2. **Concurrent task limit:** Should we limit how many tasks can run simultaneously?
3. **Execution log size limit:** Per-task limit on result payload size?

All three will be addressed with sensible defaults and per-task config options in the executor interface.
