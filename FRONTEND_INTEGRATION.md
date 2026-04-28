# Frontend Integration Guide

## 已创建的前端文件

```
web/src/pages/ExternalUserSource/
├── index.jsx                          # 主页面 (已集成所有Modal)
├── components/
│   ├── SourceFormModal.jsx            # 数据源表单
│   ├── FieldMappingModal.jsx          # 字段映射编辑
│   └── SyncLogModal.jsx               # 同步日志查看
```

## 需要手动集成的步骤

### 1. 添加路由

在主路由文件中添加 (通常是 App.jsx 或 routes/index.js):

```jsx
import ExternalUserSource from './pages/ExternalUserSource';

// 在路由配置中添加
<Route 
  path="/external-user-source" 
  element={<AdminRoute><ExternalUserSource /></AdminRoute>} 
/>
```

### 2. 添加侧边栏菜单

在侧边栏组件中添加 (通常是 SiderBar.jsx 或 Sidebar.jsx):

```jsx
import { IconLink } from '@douyinfe/semi-icons';

// 在管理员菜单项中添加
{
  itemKey: 'external-user-source',
  text: '外部用户源',
  icon: <IconLink />,
  path: '/external-user-source',
}
```

### 3. 添加权限配置

在权限配置文件中添加 (通常是 useSidebar.js 或 permissions.js):

```javascript
export const DEFAULT_ADMIN_CONFIG = {
  // ... 现有配置
  external_user_source: true,
};
```

### 4. 添加i18n翻译

在 `web/src/i18n/locales/zh.json` 中添加:

```json
{
  "外部用户源": "外部用户源",
  "添加数据源": "添加数据源",
  "编辑数据源": "编辑数据源",
  "数据源名称": "数据源名称",
  "数据库类型": "数据库类型",
  "主机地址": "主机地址",
  "端口": "端口",
  "数据库名": "数据库名",
  "用户名": "用户名",
  "密码": "密码",
  "表名": "表名",
  "查询条件": "查询条件",
  "唯一键字段": "唯一键字段",
  "启用": "启用",
  "测试连接": "测试连接",
  "立即同步": "立即同步",
  "字段映射": "字段映射",
  "同步日志": "同步日志",
  "外部字段": "外部字段",
  "本地字段": "本地字段",
  "映射方式": "映射方式",
  "直接映射": "直接映射",
  "值映射": "值映射",
  "映射规则": "映射规则"
}
```

在 `web/src/i18n/locales/en.json` 中添加:

```json
{
  "外部用户源": "External User Sources",
  "添加数据源": "Add Source",
  "编辑数据源": "Edit Source",
  "数据源名称": "Source Name",
  "数据库类型": "Database Type",
  "主机地址": "Host",
  "端口": "Port",
  "数据库名": "Database",
  "用户名": "Username",
  "密码": "Password",
  "表名": "Table Name",
  "查询条件": "WHERE Clause",
  "唯一键字段": "Unique Key",
  "启用": "Enabled",
  "测试连接": "Test Connection",
  "立即同步": "Sync Now",
  "字段映射": "Field Mappings",
  "同步日志": "Sync Logs",
  "外部字段": "External Field",
  "本地字段": "Local Field",
  "映射方式": "Transform Type",
  "直接映射": "Direct",
  "值映射": "Value Map",
  "映射规则": "Transform Config"
}
```

## 前端文件说明

### index.jsx - 主页面

功能:
- 数据源列表展示 (表格)
- 测试连接
- 手动同步
- 打开字段映射
- 查看同步日志
- 编辑/删除数据源

### SourceFormModal.jsx - 数据源表单

功能:
- 新建/编辑数据源
- 所有配置字段
- 测试连接按钮
- 密码加密存储

### FieldMappingModal.jsx - 字段映射

功能:
- 表格式编辑映射
- 支持直接映射和值映射
- 添加/删除映射行
- JSON配置值映射规则

### SyncLogModal.jsx - 同步日志

功能:
- 查看同步历史
- 显示统计数据 (新增/更新/禁用/错误)
- 分页浏览
- 状态标签 (成功/失败/部分)

## 测试前端

完成集成后:

```bash
cd web
bun install
bun run dev
```

访问: http://localhost:5173/external-user-source (根据实际端口)

## API端点

前端使用的API端点:

```
GET    /api/external-user-source           # 获取列表
POST   /api/external-user-source           # 创建
PUT    /api/external-user-source/:id       # 更新
DELETE /api/external-user-source/:id       # 删除
POST   /api/external-user-source/:id/test  # 测试连接
POST   /api/external-user-source/:id/sync  # 手动同步
GET    /api/external-user-source/:id/mappings  # 获取映射
PUT    /api/external-user-source/:id/mappings  # 更新映射
GET    /api/external-user-source/:id/logs  # 获取日志
```

所有端点需要Admin权限。
