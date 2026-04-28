## ADDED Requirements

### Requirement: Task executor registry
The system SHALL provide a registry for task executors identified by unique task name.

#### Scenario: Register executor
- **WHEN** system initializes
- **THEN** all built-in executors are registered

### Requirement: Log cleanup executor
The system SHALL provide a log_cleanup executor.

#### Scenario: Clean logs
- **WHEN** log_cleanup executor runs
- **THEN** system deletes old log records

### Requirement: Token cleanup executor
The system SHALL provide a token_cleanup executor.

#### Scenario: Clean tokens
- **WHEN** token_cleanup executor runs
- **THEN** system deletes expired tokens

### Requirement: Subscription maintenance executor
The system SHALL provide a subscription_maintenance executor.

#### Scenario: Maintain subscriptions
- **WHEN** subscription_maintenance executor runs
- **THEN** system resets and expires subscriptions

### Requirement: Codex credential refresh executor
The system SHALL provide a codex_credential_refresh executor.

#### Scenario: Refresh credentials
- **WHEN** codex_credential_refresh executor runs
- **THEN** system refreshes Codex channel credentials

### Requirement: Channel cache refresh executor
The system SHALL provide a channel_cache_refresh executor.

#### Scenario: Rebuild cache
- **WHEN** channel_cache_refresh executor runs
- **THEN** system rebuilds channel cache

### Requirement: Execution timeout
Each executor SHALL respect timeout_seconds.

#### Scenario: Timeout exceeded
- **WHEN** executor exceeds timeout
- **THEN** execution is cancelled

### Requirement: Result reporting
Each executor SHALL return a result message.

#### Scenario: Success result
- **WHEN** executor completes
- **THEN** result includes count of processed items
