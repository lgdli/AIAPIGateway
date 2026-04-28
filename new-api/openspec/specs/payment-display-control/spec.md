## ADDED Requirements

### Requirement: Only configured payment methods displayed
The system SHALL only display payment options that have been properly configured.

#### Scenario: Stripe payment shown when configured
- **WHEN** Stripe API key is configured
- **THEN** Stripe payment option is displayed to users

#### Scenario: Stripe payment hidden when not configured
- **WHEN** Stripe API key is not configured
- **THEN** Stripe payment option is not displayed

#### Scenario: Epay shown when configured
- **WHEN** Epay settings are configured
- **THEN** Epay payment option is displayed

#### Scenario: Unconfigured payments hidden
- **WHEN** payment gateway has no valid credentials
- **THEN** that payment option is hidden from users
