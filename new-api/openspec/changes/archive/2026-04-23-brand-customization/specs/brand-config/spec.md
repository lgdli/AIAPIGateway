## ADDED Requirements

### Requirement: Default system name is generic
The system SHALL use "AI Gateway" as the default system name when no custom name is configured.

#### Scenario: Default name displayed
- **WHEN** system starts with default configuration
- **THEN** the page title and navigation bar display "AI Gateway"

#### Scenario: Custom name overrides default
- **WHEN** administrator sets a custom system name in settings
- **THEN** the custom name is displayed instead of default

### Requirement: Default logo is configurable
The system SHALL provide a default placeholder logo that can be replaced via admin settings.

#### Scenario: Default logo displayed
- **WHEN** system starts with default configuration
- **THEN** a placeholder logo is displayed

#### Scenario: Custom logo overrides default
- **WHEN** administrator sets a custom logo URL in settings
- **THEN** the custom logo is displayed

### Requirement: No hardcoded brand identifiers
The system SHALL NOT contain hardcoded references to "New API" or "QuantumNous" in user-facing components.

#### Scenario: No brand identifiers in UI
- **WHEN** user browses any page
- **THEN** no "New API" or "QuantumNous" text is visible in UI elements

#### Scenario: No brand identifiers in page title
- **WHEN** user views browser tab
- **THEN** the title does not contain "New API" by default
