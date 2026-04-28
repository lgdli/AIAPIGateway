## ADDED Requirements

### Requirement: Registration is disabled by default
The system SHALL have user registration disabled by default for new deployments.

#### Scenario: Registration disabled by default
- **WHEN** system starts with default configuration
- **THEN** self-registration is not available

#### Scenario: Admin can enable registration
- **WHEN** administrator enables registration in settings
- **THEN** users can self-register

### Requirement: Only admin can create users when disabled
The system SHALL only allow administrators to create new user accounts when registration is disabled.

#### Scenario: Admin creates user
- **WHEN** registration is disabled and admin creates a new user
- **THEN** the user account is created successfully

#### Scenario: Regular user cannot register
- **WHEN** registration is disabled and user attempts to access registration page
- **THEN** registration form is not available or returns error
