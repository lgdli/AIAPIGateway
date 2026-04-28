# Design: 新闻模块

## Architecture Decision 1: 数据存储方案

**Decision**: 使用独立 `news` 数据库表

**Rationale**:
- 新闻与公告（announcements）是不同概念
- 新闻需要更多字段（封面图、分类、状态）
- 独立表便于后续扩展

**Alternatives Considered**:
| 方案 | 优点 | 缺点 |
|------|------|------|
| 复用 announcements | 无需新表 | 字段不够，耦合度高 |
| 使用 options 存储 | 改动最小 | 查询效率低，不适合大量数据 |
| 新建 news 表 | 独立灵活，支持复杂查询 | 需要新建表 |

---

## Architecture Decision 2: API 设计

**Decision**: RESTful API 风格

**Endpoints**:
```
公开 API：
GET  /api/news              # 获取新闻列表（首页用）
GET  /api/news/:id          # 获取新闻详情

管理 API（需认证）：
GET  /api/news/manage       # 管理列表（含草稿）
POST /api/news              # 创建新闻
PUT  /api/news/:id          # 更新新闻
DELETE /api/news/:id        # 删除新闻
```

---

## Architecture Decision 3: 前端路由方案

**Decision**: 使用 React Router 动态路由

**Routes**: /news/:id -> web/src/pages/News/Detail.jsx

---

## Architecture Decision 4: 封面图处理

**Decision**: 支持 URL 形式，暂不支持上传

**Rationale**:
- 简化初期实现
- 管理员可使用外部图床或 CDN
- 后续可扩展图片上传功能

---

## Architecture Decision 5: 分类方案

**Decision**: 预定义分类列表

| Code | Label (中文) | Label (English) |
|------|-------------|-----------------|
| system | 系统公告 | System |
| feature | 功能更新 | Feature |
| pricing | 价格调整 | Pricing |
| notice | 通知 | Notice |

---

## Data Model

```go
type News struct {
    ID          uint      `json:"id" gorm:"primaryKey"`
    Title       string    `json:"title" gorm:"size:200;not null"`
    Summary     string    `json:"summary" gorm:"size:500"`
    Content     string    `json:"content" gorm:"type:text"`
    Image       string    `json:"image" gorm:"size:500"`
    Category    string    `json:"category" gorm:"size:50"`
    Pinned      bool      `json:"pinned" gorm:"default:false"`
    Status      int       `json:"status" gorm:"default:0"`
    PublishDate time.Time `json:"publish_date"`
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| model/news.go | CREATE | News 数据模型 |
| model/main.go | MODIFY | AutoMigrate 添加 &News{} |
| controller/news.go | CREATE | 新闻 CRUD 控制器 |
| router/api-router.go | MODIFY | 注册 news 路由 |
| web/src/pages/News/Detail.jsx | CREATE | 新闻详情页 |
| web/src/components/home/NewsSection.jsx | CREATE | 首页新闻组件 |
| web/src/pages/Home/index.jsx | MODIFY | 引入 NewsSection |
| web/src/pages/Setting/Dashboard/SettingsNews.jsx | CREATE | 管理后台 |
