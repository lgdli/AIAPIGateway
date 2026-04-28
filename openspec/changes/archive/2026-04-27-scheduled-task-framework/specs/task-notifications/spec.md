## ADDED Requirements

### Requirement: Task failure notification
The system SHALL send notification to root user when task execution fails.

#### Scenario: Notify on failure
- **WHEN** task execution fails
- **THEN** system calls NotifyRootUser with task name and error message

#### Scenario: No notification on success
- **WHEN** task execution succeeds
- **THEN** system does not send notification

### Requirement: Notification content
The system SHALL include task name, error message, and execution time in notification.

#### Scenario: Notification details
- **WHEN** failure notification is sent
- **THEN** notification includes task display name, error details, and timestamp

### Requirement: Notification type constant
The system SHALL define a new notification type constant for task failures.

#### Scenario: Add notification type
- **WHEN** system initializes
- **THEN** dto.NotifyTypeCronTaskFailed constant is available
