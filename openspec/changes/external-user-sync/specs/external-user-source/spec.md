## ADDED Requirements

### Requirement: Admin can create external user source
The system SHALL allow administrators to configure external database connections for user synchronization.

#### Scenario: Create source with valid MySQL connection
- **WHEN** admin submits source config with valid MySQL connection details
- **THEN** system saves the source and validates connection can be established

#### Scenario: Create source with valid PostgreSQL connection
- **WHEN** admin submits source config with valid PostgreSQL connection details
- **THEN** system saves the source and validates connection can be established

#### Scenario: Create source with invalid connection
- **WHEN** admin submits source config with invalid connection details
- **THEN** system returns error without saving

### Requirement: Admin can test external database connection
The system SHALL allow administrators to test connection before enabling sync.

#### Scenario: Test successful connection
- **WHEN** admin clicks "Test Connection" for a configured source
- **THEN** system attempts connection and reports success

#### Scenario: Test failed connection
- **WHEN** admin clicks "Test Connection" with invalid credentials
- **THEN** system reports connection failure with error message

### Requirement: System syncs users from external source
The system SHALL synchronize users from configured external database sources on schedule.

#### Scenario: Sync creates new users
- **WHEN** sync runs and external user does not exist locally
- **THEN** system creates new user with mapped fields and empty password

#### Scenario: Sync updates existing users
- **WHEN** sync runs and external user exists locally (matching username + empty password)
- **THEN** system updates user fields according to mappings

#### Scenario: Sync disables removed users
- **WHEN** sync runs and local user (password=empty) not found in external data
- **THEN** system sets user status to disabled (2)

#### Scenario: Sync skips non-OAuth users
- **WHEN** sync runs and local user exists with non-empty password
- **THEN** system skips that user without modification

### Requirement: System logs sync results
The system SHALL record sync operation results for auditing.

#### Scenario: Log successful sync
- **WHEN** sync completes successfully
- **THEN** system records timestamp, inserted count, updated count, disabled count

#### Scenario: Log sync errors
- **WHEN** sync encounters errors
- **THEN** system records error count and error details in log

### Requirement: Admin can manually trigger sync
The system SHALL allow administrators to trigger immediate sync.

#### Scenario: Manual sync trigger
- **WHEN** admin clicks "Sync Now" for a source
- **THEN** system executes sync immediately and displays results

### Requirement: Admin can enable/disable source
The system SHALL allow administrators to enable or disable individual sources.

#### Scenario: Disable source
- **WHEN** admin sets source enabled=false
- **THEN** system stops scheduled sync for that source

#### Scenario: Enable source
- **WHEN** admin sets source enabled=true
- **THEN** system resumes scheduled sync for that source
