## ADDED Requirements

### Requirement: Task definition storage
The system SHALL store task definitions in a database table with fields: id, name, display_name, description, cron_expression, enabled, timeout_seconds, created_at, updated_at.

#### Scenario: Create task record on deployment
- **WHEN** system starts and cron_task table exists
- **THEN** system inserts default task records with enabled=false

#### Scenario: Update task interval
- **WHEN** admin updates cron_expression via API
- **THEN** system validates cron expression and updates database

### Requirement: Task execution logging
The system SHALL log each task execution in cron_task_execution table with: id, task_id, status, started_at, finished_at, duration_ms, result_message, error_details, triggered_by.

#### Scenario: Record execution start
- **WHEN** task begins execution
- **THEN** system creates execution record with status=running

#### Scenario: Record execution success
- **WHEN** task completes successfully
- **THEN** system updates status=success and records duration

#### Scenario: Record execution failure
- **WHEN** task fails or times out
- **THEN** system updates status=failed and records error details

### Requirement: Execution log retention
The system SHALL delete execution logs older than 30 days.

#### Scenario: Cleanup old logs
- **WHEN** log_cleanup task runs
- **THEN** system deletes cron_task_execution records where created_at < now - 30 days

### Requirement: Distributed execution lock
The system SHALL prevent concurrent execution of the same task using database-level locking.

#### Scenario: Prevent concurrent execution
- **WHEN** task is scheduled to run
- **THEN** system checks for existing running execution for same task_id
- **AND** if exists, skips this execution

### Requirement: Task scheduler service
The system SHALL provide a scheduler service that loads enabled tasks, registers with cron engine, and supports dynamic updates.

#### Scenario: Scheduler initialization
- **WHEN** system starts
- **THEN** scheduler loads all enabled tasks and registers with cron engine

#### Scenario: Dynamic task enable
- **WHEN** admin enables a disabled task via API
- **THEN** scheduler adds task to cron engine

#### Scenario: Dynamic task disable
- **WHEN** admin disables an enabled task via API
- **THEN** scheduler removes task from cron engine

### Requirement: Task management API
The system SHALL provide REST API endpoints: GET /api/cron-task, GET /api/cron-task/:id, PUT /api/cron-task/:id, POST /api/cron-task/:id/trigger, GET /api/cron-task/:id/executions.

#### Scenario: List tasks
- **WHEN** admin requests GET /api/cron-task
- **THEN** system returns all tasks with status

#### Scenario: Update task configuration
- **WHEN** admin updates task via PUT /api/cron-task/:id
- **THEN** system validates cron expression and reschedules if needed

#### Scenario: Manual trigger
- **WHEN** admin requests POST /api/cron-task/:id/trigger
- **THEN** system triggers immediate task execution

#### Scenario: View execution history
- **WHEN** admin requests GET /api/cron-task/:id/executions
- **THEN** system returns paginated execution records

### Requirement: Admin-only access
All task management endpoints SHALL require admin role (role >= 100).

#### Scenario: Non-admin access denied
- **WHEN** non-admin user requests any /api/cron-task endpoint
- **THEN** system returns 403 Forbidden

### Requirement: Web UI for task management
The system SHALL provide a Web UI page for task viewing, enable/disable, schedule update, manual trigger, and execution history.

#### Scenario: View task list
- **WHEN** admin opens task management page
- **THEN** system displays all tasks in a table

#### Scenario: Toggle task status
- **WHEN** admin clicks enable/disable toggle
- **THEN** system updates task and shows confirmation

#### Scenario: Trigger task manually
- **WHEN** admin clicks Run Now button
- **THEN** system triggers task and shows status
