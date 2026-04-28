## MODIFIED Requirements

### Requirement: Default theme color is teal
The system SHALL use teal (#0f766e) as the default primary color instead of purple.

#### Scenario: Default theme color applied
- **WHEN** system starts with default configuration
- **THEN** primary UI elements use teal color (#0f766e)

#### Scenario: Custom theme via CSS variables
- **WHEN** CSS variables are modified
- **THEN** the custom theme is applied consistently across the application
