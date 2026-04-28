## ADDED Requirements

### Requirement: Administrator can view all scheduled tasks
The system SHALL display a list of all scheduled tasks in the administrative interface, showing task name, status, schedule, next execution time, and last execution result.

#### Scenario: View task list
- **WHEN** administrator navigates to the Cron Task Management page
- **THEN** system displays a table with all registered tasks
- **AND** each row shows task name, status (enabled/disabled), category, schedule, and next execution time
- **AND** system tasks are marked as non-deletable

### Requirement: Administrator can view task details
The system SHALL display detailed information about each scheduled task including execution history.

#### Scenario: View task detail
- **WHEN** administrator clicks on a task
- **THEN** system displays task configuration (Cron expression, config JSON)
- **AND** system shows last execution time, duration, and result
- **AND** system shows next scheduled execution time

### Requirement: Administrator can enable or disable tasks
The system SHALL allow administrators to toggle task execution status.

#### Scenario: Disable a task
- **WHEN** administrator clicks "Disable" on an enabled task
- **THEN** system sets task status to disabled
- **AND** task is removed from the scheduler
- **AND** next_run_at is set to NULL

#### Scenario: Enable a task
- **WHEN** administrator clicks "Enable" on a disabled task
- **THEN** system sets task status to enabled
- **AND** task is added to the scheduler
- **AND** next_run_at is calculated based on Cron expression

### Requirement: Administrator can modify task schedule
The system SHALL allow administrators to change the Cron expression for scheduled tasks.

#### Scenario: Update schedule via simple mode
- **WHEN** administrator selects "Every X minutes/hours/days" in simple mode
- **THEN** system generates the appropriate Cron expression
- **AND** next_run_at is recalculated

#### Scenario: Update schedule via advanced mode
- **WHEN** administrator enters a Cron expression in advanced mode
- **THEN** system validates the Cron expression
- **AND** if valid, updates the task schedule
- **AND** if invalid, shows validation error

### Requirement: Administrator can manually trigger tasks
The system SHALL allow administrators to execute a task immediately without waiting for scheduled time.

#### Scenario: Manual task execution
- **WHEN** administrator clicks "Run Now" on a task
- **THEN** system creates an execution record with triggered_by = "manual"
- **AND** system executes the task immediately
- **AND** task's scheduled execution is not affected

#### Scenario: Manual execution blocked if task already running
- **WHEN** administrator clicks "Run Now" on a task that is currently executing
- **THEN** system shows warning "Task is already running"
- **AND** no new execution is started

### Requirement: Administrator can view execution history
The system SHALL display execution history for all tasks with filtering capabilities.

#### Scenario: View execution history
- **WHEN** administrator navigates to Execution History page
- **THEN** system displays list of task executions sorted by time (newest first)
- **AND** each entry shows task name, start time, end time, status, and duration

#### Scenario: Filter execution history
- **WHEN** administrator selects filters (task, status, date range)
- **THEN** system filters execution records accordingly
- **AND** displays matching records with pagination

### Requirement: Administrator can view execution details
The system SHALL display detailed information about each task execution.

#### Scenario: View execution detail
- **WHEN** administrator clicks on an execution record
- **THEN** system displays execution result (JSON)
- **AND** system displays error message if execution failed
- **AND** system displays execution duration in milliseconds

### Requirement: System tasks cannot be deleted
The system SHALL prevent deletion of built-in system tasks.

#### Scenario: Attempt to delete system task
- **WHEN** administrator attempts to delete a task marked as is_system_task = true
- **THEN** system shows error "System tasks cannot be deleted"
- **AND** task is not deleted

### Requirement: Task configuration is validated
The system SHALL validate task configuration before saving.

#### Scenario: Validate Cron expression
- **WHEN** administrator saves a task with invalid Cron expression
- **THEN** system shows validation error
- **AND** task is not updated

#### Scenario: Validate config JSON
- **WHEN** administrator saves a task with invalid config JSON
- **THEN** system shows validation error
- **AND** task is not updated
