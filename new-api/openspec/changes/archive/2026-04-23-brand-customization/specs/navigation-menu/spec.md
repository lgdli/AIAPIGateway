## MODIFIED Requirements

### Requirement: Simplified navigation menu
The system SHALL NOT display "About", "Documentation", or "Related Links" menu items by default.

#### Scenario: About page accessible but not in menu
- **WHEN** user navigates directly to /about
- **THEN** the about page is displayed

#### Scenario: No documentation links in navigation
- **WHEN** user views the navigation menu
- **THEN** no links to external documentation sites are present

#### Scenario: No related projects links
- **WHEN** user views the footer
- **THEN** no links to related projects (one-api, midjourney-proxy, etc.) are displayed
