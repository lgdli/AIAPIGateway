## ADDED Requirements

### Requirement: Admin can configure field mappings
The system SHALL allow administrators to map external database fields to local user fields.

#### Scenario: Create direct field mapping
- **WHEN** admin creates mapping with transform_type="direct"
- **THEN** system maps external field value directly to local field

#### Scenario: Create value mapping
- **WHEN** admin creates mapping with transform_type="value_map"
- **THEN** system uses transform_config to convert external values to local values

### Requirement: System supports direct field mapping
The system SHALL copy external field values directly when transform_type is "direct".

#### Scenario: Map username field
- **WHEN** external user has employee_id="john123"
- **AND** mapping is external_field="employee_id" local_field="username" transform_type="direct"
- **THEN** local user username is set to "john123"

#### Scenario: Map email field
- **WHEN** external user has email="john@university.edu"
- **AND** mapping is external_field="email" local_field="email" transform_type="direct"
- **THEN** local user email is set to "john@university.edu"

### Requirement: System supports value mapping for role
The system SHALL transform external role values to local role integers.

#### Scenario: Map teacher role
- **WHEN** external user has user_type="teacher"
- **AND** mapping transform_config={"teacher": 1, "admin": 10}
- **THEN** local user role is set to 1

#### Scenario: Map admin role
- **WHEN** external user has user_type="admin"
- **AND** mapping transform_config={"teacher": 1, "admin": 10}
- **THEN** local user role is set to 10

#### Scenario: Map unknown role uses default
- **WHEN** external user has user_type="unknown"
- **AND** mapping transform_config={"teacher": 1, "admin": 10}
- **THEN** local user role is set to default value 1

### Requirement: System supports value mapping for status
The system SHALL transform external status values to local status integers.

#### Scenario: Map active status
- **WHEN** external user has status="active"
- **AND** mapping transform_config={"active": 1, "inactive": 2}
- **THEN** local user status is set to 1 (enabled)

#### Scenario: Map inactive status
- **WHEN** external user has status="inactive"
- **AND** mapping transform_config={"active": 1, "inactive": 2}
- **THEN** local user status is set to 2 (disabled)

### Requirement: Admin can update mappings
The system SHALL allow administrators to modify existing field mappings.

#### Scenario: Update mapping
- **WHEN** admin changes transform_config for a mapping
- **THEN** next sync uses updated mapping

### Requirement: Admin can delete mappings
The system SHALL allow administrators to remove field mappings.

#### Scenario: Delete mapping
- **WHEN** admin deletes a field mapping
- **THEN** next sync does not map that field

### Requirement: System validates required mappings
The system SHALL validate that required fields have mappings before enabling sync.

#### Scenario: Missing username mapping
- **WHEN** admin attempts to enable sync without username mapping
- **THEN** system returns validation error

#### Scenario: All required mappings present
- **WHEN** admin has configured mappings for username, email, display_name, role, status
- **THEN** system allows sync to proceed
