# Proposal: 新闻模块

## Overview

为 AI Gateway 添加新闻发布与展示功能，在首页显示新闻卡片列表，管理后台提供独立的新闻管理界面。

## Problem Statement

当前系统只有公告弹窗（NoticeModal），用户需要点击才能查看。缺乏：
- 首页直接展示的新闻区域
- 独立的新闻数据管理
- 新闻详情页面
- 新闻分类与筛选

## Goals

1. **首页新闻展示**：Banner 下方展示新闻卡片列表（4条）
2. **卡片式展示**：封面图 + 标题 + 摘要 + 时间 + 分类标签
3. **分类筛选**：支持按分类筛选新闻
4. **详情页面**：点击卡片跳转 /news/:id 查看完整内容
5. **管理功能**：管理员可新增/编辑/删除/发布新闻

## Non-Goals

- 新闻评论功能
- 新闻订阅/推送
- 多语言新闻版本
- 新闻搜索功能

## Capabilities

### New Capabilities

| Capability | Description |
|------------|-------------|
| `news-display` | 首页新闻卡片展示 + 详情页 |
| `news-management` | 管理后台新闻管理功能 |

### Modified Capabilities

| Capability | Changes |
|------------|---------|
| `home-page` | 新增 NewsSection 组件 |

## Success Metrics

- 首页正常展示 4 条新闻卡片
- 点击卡片可跳转详情页
- 管理后台可正常 CRUD 新闻
- 分类筛选功能正常工作

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| 封面图存储问题 | Medium | Medium | 支持 URL 形式，后续可扩展上传 |
| 数据库迁移失败 | Low | High | 使用 GORM AutoMigrate，兼容三数据库 |

## Timeline Estimate

- 后端开发：2-3 小时
- 前端开发：3-4 小时
- 测试验证：1 小时

## Dependencies

- 无外部依赖
- 复用现有 Semi Design UI 组件
- 复用现有路由/认证体系

## Stakeholders

- 管理员：发布和管理新闻
- 用户：首页查看新闻
