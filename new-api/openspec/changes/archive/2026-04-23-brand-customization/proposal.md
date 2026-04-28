## Why

New API 项目作为开源 AI 网关系统，包含了大量原项目品牌标识、作者署名、GitHub 链接等水印信息。对于需要进行二次开发和私有化部署的用户，这些标识会造成品牌混淆，影响用户体验。需要进行品牌定制化改造，使系统支持完全自定义品牌标识。

## What Changes

- 去除所有 "New API"、"QuantumNous" 原项目标识、版权声明、开源声明水印
- 删除页面内所有跳转 GitHub 的官方链接（包括首页、关于页、页脚等）
- 关闭自动版本更新检测功能和后台更新提示按钮
- 修改默认网站名称、LOGO、图标为可配置项（保留后台配置功能）
- 自定义首页文案，移除原版介绍内容
- 删减无用菜单：关于、官方文档、友情链接等入口
- 自定义底部备案号、客服微信、联系方式配置
- 统一品牌配色，替换默认蓝紫色主题
- 关闭自助注册功能，仅支持管理员手动添加用户
- 隐藏多余支付渠道入口，只保留已配置的支付方式

## Capabilities

### New Capabilities

- `brand-config`: 品牌配置能力，包括系统名称、LOGO、图标、配色等可配置项
- `footer-config`: 页脚配置能力，支持自定义备案号、联系方式、客服微信等
- `registration-control`: 注册控制能力，支持关闭自助注册
- `payment-display-control`: 支付渠道显示控制，按配置显示支付方式

### Modified Capabilities

- `ui-theme`: 修改默认主题配色方案
- `navigation-menu`: 修改导航菜单结构，移除无用菜单项
- `home-page`: 修改首页默认展示内容
- `update-check`: 禁用版本更新检测功能

## Impact

**前端文件**:
- `web/src/index.jsx` - 控制台输出
- `web/src/index.css` - 主题配色变量
- `web/src/pages/Home/index.jsx` - 首页内容
- `web/src/pages/About/index.jsx` - 关于页面
- `web/src/components/layout/Footer.jsx` - 页脚组件
- `web/src/components/layout/SiderBar.jsx` - 侧边栏菜单
- `web/src/components/layout/headerbar/Navigation.jsx` - 顶部导航
- `web/src/components/settings/OtherSetting.jsx` - 更新检测
- `web/src/helpers/utils.jsx` - 默认系统名称
- `web/index.html` - 页面标题
- `web/public/logo.png` - 默认 LOGO
- `web/public/favicon.ico` - 默认图标

**后端文件**:
- `common/constants.go` - 默认系统名称常量

**配置文件**:
- 所有 `.jsx` 文件头部的版权声明（需删除）
