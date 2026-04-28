# Spec: news-management

## Summary

管理后台新闻管理功能，支持新增、编辑、删除、发布/取消发布、置顶操作。

---

## UI Specification

### 新闻管理页面

**Location**: 设置 -> 控制台设置 -> 新闻管理

**Table Columns**:
| Column | Field | Notes |
|--------|-------|-------|
| 标题 | title | 显示前 50 字符，超出省略 |
| 分类 | category | 标签形式显示 |
| 状态 | status | 草稿(灰色) / 已发布(绿色) |
| 发布时间 | publish_date | 仅已发布显示，草稿显示 "-" |
| 操作 | - | 编辑 / 删除按钮 |

**Actions**:
- 点击"新增新闻" -> 打开新增弹窗
- 点击"编辑" -> 打开编辑弹窗
- 点击"删除" -> 确认后删除

---

### 新增/编辑弹窗

**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| 标题 | Input | Yes | 最大 200 字符 |
| 分类 | Select | Yes | system/feature/pricing/notice |
| 封面图 | Input | No | URL 形式 |
| 摘要 | TextArea | No | 最大 500 字符 |
| 正文 | TextArea | No | 支持 Markdown |
| 置顶 | Switch | No | 默认关闭 |
| 发布状态 | Select | Yes | 草稿/已发布 |

**Validation**:
- 标题必填，最大 200 字符
- 分类必选
- 发布状态必选

**Behavior**:
- 保存草稿: status=0, 不设置 publish_date
- 发布: status=1, 自动设置 publish_date 为当前时间
- 编辑已发布新闻: 可修改内容，不更新 publish_date

---

## API Specification

### GET /api/news/manage

获取管理列表（含草稿）

**Auth**: 需要管理员权限

**Query Params**:
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| page | int | 1 | 页码 |
| page_size | int | 10 | 每页条数 |

**Response**:
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": 1,
      "title": "系统升级通知",
      "category": "system",
      "status": 1,
      "pinned": true,
      "publish_date": "2024-01-15T10:00:00Z",
      "created_at": "2024-01-14T08:00:00Z"
    }
  ],
  "total": 15
}
```

---

### POST /api/news

创建新闻

**Auth**: 需要管理员权限

**Request Body**:
```json
{
  "title": "系统升级通知",
  "summary": "系统将于...",
  "content": "## 详细内容\n\n...",
  "image": "https://...",
  "category": "system",
  "pinned": false,
  "status": 1
}
```

**Response**:
```json
{
  "success": true,
  "message": "创建成功",
  "data": { "id": 1 }
}
```

---

### PUT /api/news/:id

更新新闻

**Auth**: 需要管理员权限

**Request Body**: 同 POST

---

### DELETE /api/news/:id

删除新闻

**Auth**: 需要管理员权限

---

## Acceptance Criteria

- [ ] 管理后台可访问新闻管理页面
- [ ] 列表正确显示所有新闻（含草稿）
- [ ] 新增新闻功能正常
- [ ] 编辑新闻功能正常
- [ ] 删除新闻功能正常（需确认）
- [ ] 发布/草稿状态切换正常
- [ ] 置顶功能正常
- [ ] 分页功能正常
