## Context

New API 是一个基于 Go + React 的 AI 网关系统，当前包含大量原项目品牌标识。系统已支持部分后台配置（系统名称、LOGO、页脚等），但存在硬编码默认值和 GitHub 链接。

**当前状态**:
- 系统名称默认值硬编码在 common/constants.go 和 web/src/helpers/utils.jsx
- GitHub 链接分散在多个前端组件中
- 版本更新检测调用 GitHub API
- 主题配色通过 CSS 变量控制
- 注册开关已在后端实现

## Goals / Non-Goals

**Goals:**
- 去除所有原项目品牌标识和 GitHub 链接
- 禁用版本更新检测功能
- 修改默认配置为通用值
- 简化导航菜单和页脚
- 保持后台配置功能不变

**Non-Goals:**
- 不新增品牌配置项（使用现有配置）
- 不修改后端 API 接口
- 不改变数据库结构

## Decisions

### 1. 默认名称处理
修改默认值为通用占位符 "AI Gateway"，用户可通过后台配置自己的品牌

### 2. GitHub 链接处理
直接删除所有 GitHub 链接，不替换为其他链接，避免引入新的外部依赖

### 3. 版本更新检测
完全禁用检查更新功能，私有化部署不需要指向原项目的更新检测

### 4. 主题配色
保持现有 CSS 变量机制，仅修改默认色值为 teal (#0f766e)

### 5. 菜单精简
通过默认配置隐藏无用菜单，保留功能完整性

### 6. 注册控制
修改默认值为 RegisterEnabled = false，私有化部署通常需要控制用户来源

## Risks / Trade-offs

**风险**: 修改后无法恢复原项目标识 → 用户可自行 fork 原项目
**风险**: 删除更新检测后用户无法感知新版本 → 私有化部署用户通常有独立的版本管理流程
**风险**: 主题色变更可能影响现有用户习惯 → 提供后台配置入口，用户可自定义

## Migration Plan

1. 备份原 web/public/logo.png 和 favicon.ico
2. 替换默认 LOGO 和图标
3. 修改代码文件
4. 重新构建前端 (cd web && bun run build)
5. 重新编译后端 (go build)
6. 通过后台配置新的品牌信息

## Open Questions

无
