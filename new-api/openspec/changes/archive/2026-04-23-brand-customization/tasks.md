## 1. Backend Default Values

- [ ] 1.1 Modify common/constants.go:15 - Change SystemName from "New API" to "AI Gateway"
- [ ] 1.2 Modify common/constants.go:52 - Change RegisterEnabled from true to false

## 2. Frontend Default Values

- [ ] 2.1 Modify web/src/helpers/utils.jsx:51 - Change default system name to "AI Gateway"
- [ ] 2.2 Modify web/index.html:19 - Change page title to "AI Gateway"
- [ ] 2.3 Modify web/index.html:18 - Change meta generator from "new-api" to "ai-gateway"

## 3. Remove GitHub Links - Home Page

- [ ] 3.1 Modify web/src/pages/Home/index.jsx:227-240 - Remove GitHub button and version display
- [ ] 3.2 Modify web/src/pages/Home/index.jsx:40 - Remove IconGithubLogo import

## 4. Remove GitHub Links - About Page

- [ ] 4.1 Modify web/src/pages/About/index.jsx:65-131 - Remove all GitHub links and project attribution
- [ ] 4.2 Replace customDescription with generic content

## 5. Remove GitHub Links - Footer

- [ ] 5.1 Modify web/src/components/layout/Footer.jsx:59-186 - Remove "About Us", "Documentation", "Related Projects", "Friend Links" sections
- [ ] 5.2 Modify web/src/components/layout/Footer.jsx:202-209 - Remove "Designed by New API" attribution

## 6. Disable Version Update Check

- [ ] 6.1 Modify web/src/components/settings/OtherSetting.jsx:231-280 - Remove checkUpdate function
- [ ] 6.2 Modify web/src/components/settings/OtherSetting.jsx:338-344 - Remove "Check Update" button
- [ ] 6.3 Modify web/src/components/settings/OtherSetting.jsx:501-519 - Remove update modal
- [ ] 6.4 Remove updateData state and showUpdateModal state

## 7. Theme Color Changes

- [ ] 7.1 Modify web/src/index.css:380 - Change default primary color from #6d28d9 to #0f766e

## 8. Remove Copyright Headers

- [ ] 8.1 Remove copyright headers from web/src/index.jsx
- [ ] 8.2 Remove copyright headers from web/src/pages/Home/index.jsx
- [ ] 8.3 Remove copyright headers from web/src/pages/About/index.jsx
- [ ] 8.4 Remove copyright headers from web/src/components/layout/Footer.jsx
- [ ] 8.5 Remove copyright headers from web/src/components/layout/SiderBar.jsx
- [ ] 8.6 Remove copyright headers from web/src/components/layout/headerbar/Navigation.jsx
- [ ] 8.7 Remove copyright headers from web/src/components/settings/OtherSetting.jsx

## 9. Console Output Cleanup

- [ ] 9.1 Modify web/src/index.jsx:40 - Remove GitHub URL from console log

## 10. Default Assets (Optional)

- [ ] 10.1 Replace web/public/logo.png with placeholder logo
- [ ] 10.2 Replace web/public/favicon.ico with placeholder icon

## 11. Build and Verify

- [ ] 11.1 Run cd web && bun run build to rebuild frontend
- [ ] 11.2 Run go build to rebuild backend
- [ ] 11.3 Verify no "New API" or "QuantumNous" text appears in UI
- [ ] 11.4 Verify no GitHub links in navigation or footer
- [ ] 11.5 Verify version update button is removed from settings
